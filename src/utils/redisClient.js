import Redis from "ioredis";
import logger from "./logger.js";

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.client) {
      return this.client;
    }

    try {
      const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
      
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        enableReadyCheck: true,
        lazyConnect: true
      });

      this.client.on("connect", () => {
        logger.info("Redis client connected");
        this.isConnected = true;
      });

      this.client.on("error", (err) => {
        logger.error({ err }, "Redis connection error");
        this.isConnected = false;
      });

      this.client.on("close", () => {
        logger.warn("Redis connection closed");
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;
    } catch (err) {
      logger.error({ err }, "Failed to initialize Redis client");
      this.isConnected = false;
      return null;
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.error({ err, key }, "Redis GET error");
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (!this.isConnected || !this.client) {
      return false;
    }
    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttlSeconds, serialized);
      return true;
    } catch (err) {
      logger.error({ err, key }, "Redis SET error");
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }
    try {
      await this.client.del(key);
      return true;
    } catch (err) {
      logger.error({ err, key }, "Redis DEL error");
      return false;
    }
  }

  async incr(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }
    try {
      return await this.client.incr(key);
    } catch (err) {
      logger.error({ err, key }, "Redis INCR error");
      return null;
    }
  }

  async expire(key, seconds) {
    if (!this.isConnected || !this.client) {
      return false;
    }
    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (err) {
      logger.error({ err, key }, "Redis EXPIRE error");
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }
}

export const redisClient = new RedisClient();
