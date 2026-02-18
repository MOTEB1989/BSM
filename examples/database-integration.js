/**
 * Example: Integrating MySQL Database with BSM Platform
 * 
 * This file demonstrates how to integrate the optional MySQL database
 * module with the BSM platform for agent execution logging and audit trails.
 * 
 * Note: This is an example only. The BSM platform works without database
 * connectivity. Only use this if you need persistent storage.
 * 
 * Prerequisites:
 * 1. Install mysql2: npm install mysql2
 * 2. Start MySQL: docker-compose -f docker-compose.mysql.yml up -d
 * 3. Configure .env with MySQL credentials
 */

import express from 'express';
import { query, queryOne, healthCheck, beginTransaction } from '../src/database/mysql.js';

const router = express.Router();

/**
 * Example 1: Add Database Health Check to /api/health
 * 
 * Extend the existing health endpoint to include database status
 */
export async function healthWithDatabase(req, res) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok',
      database: await healthCheck() ? 'ok' : 'unavailable'
    }
  };
  
  res.json(health);
}

/**
 * Example 2: Log Agent Execution to Database
 * 
 * Add this to your agent execution flow to persist execution logs
 */
export async function logAgentExecution(agentId, userId, input, output, status, durationMs) {
  try {
    const startTime = new Date(Date.now() - durationMs);
    
    await query(`
      INSERT INTO agent_executions 
      (agent_id, user_id, input, output, status, duration_ms, started_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [agentId, userId, input, output, status, durationMs, startTime]);
    
    console.log(`✓ Logged execution for agent ${agentId}`);
  } catch (error) {
    // Log error but don't fail the agent execution
    console.error('Failed to log agent execution:', error.message);
  }
}

/**
 * Example 3: Get Recent Agent Executions
 * 
 * API endpoint to retrieve execution history
 */
router.get('/executions/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const executions = await query(`
      SELECT 
        e.id,
        e.agent_id,
        a.name as agent_name,
        e.status,
        e.duration_ms,
        e.started_at,
        e.completed_at
      FROM agent_executions e
      LEFT JOIN agents a ON e.agent_id = a.id
      ORDER BY e.started_at DESC
      LIMIT ?
    `, [limit]);
    
    res.json({
      success: true,
      count: executions.length,
      executions
    });
  } catch (error) {
    console.error('Error fetching executions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch executions'
    });
  }
});

/**
 * Example 4: Get Agent Statistics
 * 
 * API endpoint for agent performance metrics
 */
router.get('/agents/:agentId/stats', async (req, res) => {
  try {
    const { agentId } = req.params;
    
    const stats = await queryOne(`
      SELECT 
        COUNT(*) as total_executions,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed,
        AVG(duration_ms) as avg_duration_ms,
        MIN(duration_ms) as min_duration_ms,
        MAX(duration_ms) as max_duration_ms
      FROM agent_executions
      WHERE agent_id = ?
    `, [agentId]);
    
    res.json({
      success: true,
      agentId,
      stats
    });
  } catch (error) {
    console.error('Error fetching agent stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent statistics'
    });
  }
});

/**
 * Example 5: Create Audit Log Entry
 * 
 * Add this to controllers to maintain comprehensive audit trail
 */
export async function createAuditLog(eventType, action, req, details = {}) {
  try {
    await query(`
      INSERT INTO audit_logs 
      (event_type, action, ip_address, user_agent, details, correlation_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      eventType,
      action,
      req.ip,
      req.get('user-agent'),
      JSON.stringify(details),
      req.correlationId
    ]);
  } catch (error) {
    console.error('Failed to create audit log:', error.message);
  }
}

/**
 * Example 6: Search Knowledge Documents
 * 
 * Full-text search in knowledge base
 */
router.get('/knowledge/search', async (req, res) => {
  try {
    const { q, category, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }
    
    let sql = `
      SELECT id, title, category, created_at,
             MATCH(title, content) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
      FROM knowledge_documents
      WHERE MATCH(title, content) AGAINST(? IN NATURAL LANGUAGE MODE)
    `;
    
    const params = [q, q];
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    sql += ' ORDER BY relevance DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const documents = await query(sql, params);
    
    res.json({
      success: true,
      query: q,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('Error searching knowledge:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

/**
 * Example 7: Transaction Example
 * 
 * Create user and log the action in a transaction
 */
export async function createUserWithAudit(username, email, role, req) {
  const connection = await beginTransaction();
  
  try {
    // Insert user
    const [result] = await connection.execute(
      'INSERT INTO users (username, email, role) VALUES (?, ?, ?)',
      [username, email, role]
    );
    
    const userId = result.insertId;
    
    // Log audit entry
    await connection.execute(
      'INSERT INTO audit_logs (event_type, action, details) VALUES (?, ?, ?)',
      ['user_management', 'user_created', JSON.stringify({ userId, username, email, role })]
    );
    
    // Commit transaction
    await connection.commit();
    
    return { success: true, userId };
  } catch (error) {
    // Rollback on error
    await connection.rollback();
    console.error('Transaction failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Example 8: Integration with Express App
 * 
 * Add to your src/app.js or src/routes/index.js
 */
export function setupDatabaseRoutes(app) {
  // Only setup database routes if database is configured
  if (process.env.MYSQL_PASSWORD) {
    console.log('✓ Database routes enabled');
    
    // Health check with database
    app.get('/api/health/detailed', healthWithDatabase);
    
    // Agent execution history
    app.use('/api/db', router);
    
    console.log('  - GET /api/health/detailed');
    console.log('  - GET /api/db/executions/recent');
    console.log('  - GET /api/db/agents/:agentId/stats');
    console.log('  - GET /api/db/knowledge/search');
  } else {
    console.log('ℹ Database not configured, skipping database routes');
  }
}

/**
 * Usage in src/app.js:
 * 
 * import { setupDatabaseRoutes } from './examples/database-integration.js';
 * 
 * // After all other middleware
 * setupDatabaseRoutes(app);
 */

export default router;
