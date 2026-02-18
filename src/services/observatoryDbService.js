import { getPool } from '../config/database.js';
import logger from '../utils/logger.js';

// Initialize database schema
export async function initializeSchema() {
  const pool = getPool();
  
  try {
    // Create metrics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_metrics (
        id SERIAL PRIMARY KEY,
        agent_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        response_time_ms INTEGER NOT NULL,
        success BOOLEAN NOT NULL,
        model VARCHAR(100),
        tokens_used INTEGER DEFAULT 0,
        prompt_tokens INTEGER DEFAULT 0,
        completion_tokens INTEGER DEFAULT 0,
        cost_usd DECIMAL(10, 6) DEFAULT 0,
        error_message TEXT,
        metadata JSONB
      )
    `);
    
    // Create conversation analytics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversation_analytics (
        id SERIAL PRIMARY KEY,
        conversation_id VARCHAR(255) NOT NULL,
        agent_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        message_count INTEGER DEFAULT 1,
        sentiment_score DECIMAL(5, 2),
        sentiment_label VARCHAR(50),
        topics JSONB,
        language VARCHAR(10),
        metadata JSONB
      )
    `);
    
    // Create AB test configurations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ab_test_configs (
        id SERIAL PRIMARY KEY,
        test_name VARCHAR(255) UNIQUE NOT NULL,
        agent_id VARCHAR(255) NOT NULL,
        variant_a JSONB NOT NULL,
        variant_b JSONB NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create AB test results table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ab_test_results (
        id SERIAL PRIMARY KEY,
        test_id INTEGER REFERENCES ab_test_configs(id),
        variant VARCHAR(10) NOT NULL,
        user_id VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        response_time_ms INTEGER,
        success BOOLEAN,
        tokens_used INTEGER,
        cost_usd DECIMAL(10, 6),
        user_rating INTEGER
      )
    `);
    
    // Create alerts configuration table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alert_configs (
        id SERIAL PRIMARY KEY,
        alert_name VARCHAR(255) UNIQUE NOT NULL,
        agent_id VARCHAR(255),
        alert_type VARCHAR(50) NOT NULL,
        threshold_value DECIMAL(10, 2) NOT NULL,
        condition VARCHAR(20) NOT NULL,
        active BOOLEAN DEFAULT true,
        notification_channels JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create alerts history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alert_history (
        id SERIAL PRIMARY KEY,
        alert_id INTEGER REFERENCES alert_configs(id),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        triggered_value DECIMAL(10, 2),
        message TEXT,
        resolved BOOLEAN DEFAULT false,
        resolved_at TIMESTAMP
      )
    `);
    
    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_metrics_timestamp ON agent_metrics(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_id ON agent_metrics(agent_id);
      CREATE INDEX IF NOT EXISTS idx_agent_metrics_user_id ON agent_metrics(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversation_analytics_timestamp ON conversation_analytics(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_conversation_analytics_agent_id ON conversation_analytics(agent_id);
      CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_id ON ab_test_results(test_id);
      CREATE INDEX IF NOT EXISTS idx_alert_history_timestamp ON alert_history(timestamp DESC);
    `);
    
    logger.info('Observatory database schema initialized successfully');
    return true;
  } catch (err) {
    logger.error({ err }, 'Failed to initialize observatory database schema');
    throw err;
  }
}

// Record agent metrics
export async function recordMetric(metric) {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      INSERT INTO agent_metrics (
        agent_id, user_id, response_time_ms, success, model,
        tokens_used, prompt_tokens, completion_tokens, cost_usd,
        error_message, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      metric.agentId,
      metric.userId || null,
      metric.responseTimeMs,
      metric.success,
      metric.model || null,
      metric.tokensUsed || 0,
      metric.promptTokens || 0,
      metric.completionTokens || 0,
      metric.costUsd || 0,
      metric.errorMessage || null,
      metric.metadata ? JSON.stringify(metric.metadata) : null
    ]);
    
    return result.rows[0].id;
  } catch (err) {
    logger.error({ err, metric }, 'Failed to record agent metric');
    throw err;
  }
}

// Get aggregated metrics for dashboard
export async function getAggregatedMetrics(agentId = null, timeRange = '24h') {
  const pool = getPool();
  
  const timeIntervals = {
    '1h': '1 hour',
    '6h': '6 hours',
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days'
  };
  
  const interval = timeIntervals[timeRange] || '24 hours';
  
  try {
    const whereClause = agentId ? 'WHERE agent_id = $1 AND' : 'WHERE';
    const params = agentId ? [agentId] : [];
    
    const query = `
      SELECT
        agent_id,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN success = true THEN 1 END) as successful_requests,
        AVG(response_time_ms) as avg_response_time,
        MAX(response_time_ms) as max_response_time,
        SUM(tokens_used) as total_tokens,
        SUM(cost_usd) as total_cost
      FROM agent_metrics
      ${whereClause} timestamp > NOW() - INTERVAL '${interval}'
      ${agentId ? '' : 'GROUP BY agent_id'}
    `;
    
    const result = await pool.query(query, params);
    return result.rows;
  } catch (err) {
    logger.error({ err }, 'Failed to get aggregated metrics');
    throw err;
  }
}

// Record conversation analytics
export async function recordConversationAnalytics(analytics) {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      INSERT INTO conversation_analytics (
        conversation_id, agent_id, user_id, message_count,
        sentiment_score, sentiment_label, topics, language, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      analytics.conversationId,
      analytics.agentId,
      analytics.userId || null,
      analytics.messageCount || 1,
      analytics.sentimentScore || null,
      analytics.sentimentLabel || null,
      analytics.topics ? JSON.stringify(analytics.topics) : null,
      analytics.language || 'en',
      analytics.metadata ? JSON.stringify(analytics.metadata) : null
    ]);
    
    return result.rows[0].id;
  } catch (err) {
    logger.error({ err, analytics }, 'Failed to record conversation analytics');
    throw err;
  }
}

export default {
  initializeSchema,
  recordMetric,
  getAggregatedMetrics,
  recordConversationAnalytics
};
