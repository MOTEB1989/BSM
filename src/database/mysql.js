/**
 * MySQL Database Connection Helper
 * 
 * This is an optional helper module for connecting to MySQL.
 * The BSM platform currently doesn't require database connectivity,
 * but this module is provided for future extensions.
 * 
 * Prerequisites:
 * 1. Install mysql2 package: npm install mysql2
 * 2. Configure environment variables in .env
 * 3. Ensure MySQL service is running (docker-compose.mysql.yml)
 * 
 * Usage:
 * import { getConnection, query } from './database/mysql.js';
 * 
 * // Get a connection
 * const connection = await getConnection();
 * 
 * // Execute a query
 * const [rows] = await query('SELECT * FROM users WHERE id = ?', [userId]);
 * 
 * @module database/mysql
 */

import { createPool } from 'mysql2/promise';
import { env } from '../config/env.js';

let pool = null;

/**
 * MySQL connection configuration
 */
const config = {
  host: env.MYSQL_HOST || 'localhost',
  port: parseInt(env.MYSQL_PORT || '3306', 10),
  user: env.MYSQL_USER || 'bsm_user',
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DATABASE || 'bsm_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: 'Z', // UTC
  dateStrings: true,
};

/**
 * Initialize MySQL connection pool
 * @returns {Pool} MySQL connection pool
 */
export function initPool() {
  if (!pool) {
    // Check if MySQL password is configured
    if (!config.password) {
      throw new Error(
        'MySQL connection not configured. Set MYSQL_PASSWORD in environment variables.'
      );
    }

    pool = createPool(config);
    
    // Test connection
    pool.getConnection()
      .then(connection => {
        console.log('✓ MySQL connection pool initialized');
        connection.release();
      })
      .catch(err => {
        console.error('✗ MySQL connection failed:', err.message);
        console.error('  Check: 1) MySQL service is running (docker-compose ps)');
        console.error('         2) Credentials in .env match docker-compose configuration');
        console.error('         3) MySQL port 3306 is accessible');
        throw err;
      });
  }
  
  return pool;
}

/**
 * Get a connection from the pool
 * @returns {Promise<Connection>} MySQL connection
 */
export async function getConnection() {
  if (!pool) {
    initPool();
  }
  return await pool.getConnection();
}

/**
 * Execute a query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
export async function query(sql, params = []) {
  if (!pool) {
    initPool();
  }
  
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('MySQL query error:', error.message);
    console.error('SQL:', sql);
    throw error;
  }
}

/**
 * Execute a query and return single row
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} Single row or null
 */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Begin a transaction
 * @returns {Promise<Connection>} Connection with active transaction
 */
export async function beginTransaction() {
  const connection = await getConnection();
  await connection.beginTransaction();
  return connection;
}

/**
 * Health check for MySQL connection
 * @returns {Promise<boolean>} true if connected, false otherwise
 */
export async function healthCheck() {
  try {
    if (!pool) {
      return false;
    }
    
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT 1 as health');
    connection.release();
    
    return rows[0].health === 1;
  } catch (error) {
    console.error('MySQL health check failed:', error.message);
    return false;
  }
}

/**
 * Close all connections in the pool
 * @returns {Promise<void>}
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('MySQL connection pool closed');
  }
}

/**
 * Example queries (for reference)
 */
export const examples = {
  // Users
  getUserById: (id) => query('SELECT * FROM users WHERE id = ?', [id]),
  createUser: (username, email, role) => 
    query('INSERT INTO users (username, email, role) VALUES (?, ?, ?)', [username, email, role]),
  
  // Agents
  getActiveAgents: () => query('SELECT * FROM active_agents'),
  getAgentById: (id) => queryOne('SELECT * FROM agents WHERE id = ?', [id]),
  
  // Agent Executions
  createExecution: (agentId, userId, input) =>
    query(
      'INSERT INTO agent_executions (agent_id, user_id, input, status) VALUES (?, ?, ?, ?)',
      [agentId, userId, input, 'pending']
    ),
  completeExecution: (id, output, status, durationMs) =>
    query(
      'UPDATE agent_executions SET output = ?, status = ?, duration_ms = ?, completed_at = NOW() WHERE id = ?',
      [output, status, durationMs, id]
    ),
  
  // Audit Logs
  createAuditLog: (eventType, action, userId, details) =>
    query(
      'INSERT INTO audit_logs (event_type, action, user_id, details) VALUES (?, ?, ?, ?)',
      [eventType, action, userId, JSON.stringify(details)]
    ),
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing MySQL connections...');
  await closePool();
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing MySQL connections...');
  await closePool();
});

export default {
  initPool,
  getConnection,
  query,
  queryOne,
  beginTransaction,
  healthCheck,
  closePool,
  examples,
};
