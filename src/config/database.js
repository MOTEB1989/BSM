import pg from 'pg';
import { env } from './env.js';
import logger from '../utils/logger.js';

const { Pool } = pg;

// Weak password list
const WEAK_PASSWORDS = ['bsm_password', 'password', '123456', 'admin', 'root'];

// Validate database password in production
function validateDatabasePassword(password) {
  if (env.nodeEnv !== 'production') {
    return; // Skip validation in non-production environments
  }
  
  if (!password) {
    const error = 'Database password must be set in production';
    logger.error(error);
    throw new Error(error);
  }
  
  // Check minimum length
  if (password.length < 12) {
    const error = 'Database password must be at least 12 characters in production';
    logger.error(error);
    throw new Error(error);
  }
  
  // Check against weak password list
  if (WEAK_PASSWORDS.includes(password)) {
    const error = `Database password cannot be a weak password (${password}) in production`;
    logger.error(error);
    throw new Error(error);
  }
}

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

// Validate password before proceeding
validateDatabasePassword(dbConfig.password);

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
