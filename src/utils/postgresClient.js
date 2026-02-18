import pg from "pg";
import logger from "./logger.js";

const { Pool } = pg;

class PostgresClient {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.pool) {
      return this.pool;
    }

    try {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL || "postgresql://bsu_user:bsu_secure_password_change_me@localhost:5432/bsu_gateway",
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      this.pool.on("error", (err) => {
        logger.error({ err }, "Unexpected PostgreSQL pool error");
        this.isConnected = false;
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query("SELECT NOW()");
      client.release();
      
      this.isConnected = true;
      logger.info("PostgreSQL client connected");
      
      return this.pool;
    } catch (err) {
      logger.error({ err }, "Failed to initialize PostgreSQL client");
      this.isConnected = false;
      return null;
    }
  }

  async query(text, params = []) {
    if (!this.pool) {
      throw new Error("PostgreSQL pool not initialized");
    }
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (err) {
      logger.error({ err, text }, "PostgreSQL query error");
      throw err;
    }
  }

  async getClient() {
    if (!this.pool) {
      await this.connect();
    }
    return this.pool.connect();
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      logger.info("PostgreSQL pool closed");
    }
  }
}

export const postgresClient = new PostgresClient();
