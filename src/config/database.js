import pg from 'pg';
import { env } from './env.js';
import logger from '../utils/logger.js';

const { Pool } = pg;

// Weak/default passwords that should not be used in production
const WEAK_PASSWORDS = ['bsm_password', 'password', '123456', 'admin', 'root', ''];

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'bsm_observatory',
  user: process.env.DB_USER || 'bsm_user',
  password: process.env.DB_PASSWORD || 'bsm_password',
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Validate database credentials in production
if (env.nodeEnv === 'production') {
  if (!dbConfig.password || WEAK_PASSWORDS.includes(dbConfig.password)) {
    throw new Error(
      'Production database password is weak or missing. ' +
      'Set a strong password via DB_PASSWORD environment variable. ' +
      'Password must not be empty or a common default value.'
    );
  }
  
  if (dbConfig.password.length < 12) {
    throw new Error(
      'Production database password must be at least 12 characters. ' +
      'Set a strong password via DB_PASSWORD environment variable.'
    );
  }
  
  // Warn about default username
  if (dbConfig.user === 'bsm_user') {
    logger.warn('⚠️  WARNING: Using default database username in production. Consider changing DB_USER for enhanced security.');
  }
}

// Create pool instance
let pool = null;

export function getPool() {
  if (!pool) {
    pool = new Pool(dbConfig);
    
    pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected database pool error');
    });
    
    pool.on('connect', () => {
      logger.debug('New database connection established');
    });
  }
  
  return pool;
}

// Test database connection
export async function testConnection() {
  try {
    const pool = getPool();
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection successful');
    return true;
  } catch (err) {
    logger.error({ err }, 'Database connection failed');
    return false;
  }
}

// Close pool
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
}

export default { getPool, testConnection, closePool };
