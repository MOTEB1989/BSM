import pg from 'pg';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

const { Pool } = pg;

// Database configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'bsm',
  user: process.env.POSTGRES_USER || 'bsm_user',
  password: process.env.POSTGRES_PASSWORD || 'bsm_password_dev',
  max: parseInt(process.env.POSTGRES_POOL_SIZE || '20'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Create connection pool
let pool = null;

export function getPool() {
  if (!pool) {
    pool = new Pool(dbConfig);
    
    pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected database pool error');
    });

    pool.on('connect', () => {
      logger.debug('Database client connected');
    });
  }
  
  return pool;
}

export async function query(text, params) {
  const client = getPool();
  try {
    const start = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    logger.debug({ text, duration, rows: result.rowCount }, 'Executed query');
    return result;
  } catch (error) {
    logger.error({ error, text }, 'Database query error');
    throw error;
  }
}

export async function getClient() {
  const pool = getPool();
  return pool.connect();
}

export async function transaction(callback) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
}

// Initialize database (create tables if they don't exist)
export async function initializeDatabase() {
  try {
    const client = await getClient();
    try {
      // Check if tables exist
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'gateway_providers'
        );
      `);
      
      if (!result.rows[0].exists) {
        logger.info('Gateway tables do not exist, skipping initialization');
        logger.info('To create tables, run the schema.sql file manually');
      } else {
        logger.info('Gateway database tables verified');
      }
    } finally {
      client.release();
    }
  } catch (error) {
    // Database connection might not be available
    logger.warn({ error: error.message }, 'Database initialization skipped');
  }
}

export default {
  query,
  getClient,
  getPool,
  transaction,
  closePool,
  initializeDatabase
};
