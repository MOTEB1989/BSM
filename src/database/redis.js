import Redis from 'ioredis';
import logger from '../utils/logger.js';

let redisClient = null;

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
};

export function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis(redisConfig);

    redisClient.on('connect', () => {
      logger.info('Redis client connecting');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('error', (err) => {
      logger.error({ err }, 'Redis client error');
    });

    redisClient.on('close', () => {
      logger.info('Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis client reconnecting');
    });
  }

  return redisClient;
}

export async function connectRedis() {
  try {
    const client = getRedisClient();
    await client.connect();
    logger.info('Redis connected successfully');
    return client;
  } catch (error) {
    logger.warn({ error: error.message }, 'Redis connection failed, cache disabled');
    return null;
  }
}

export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
}

// Helper functions for common operations
export async function cacheGet(key) {
  try {
    const client = getRedisClient();
    if (!client || client.status !== 'ready') return null;
    
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error({ error, key }, 'Cache get error');
    return null;
  }
}

export async function cacheSet(key, value, ttlSeconds = 3600) {
  try {
    const client = getRedisClient();
    if (!client || client.status !== 'ready') return false;
    
    await client.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error({ error, key }, 'Cache set error');
    return false;
  }
}

export async function cacheDel(key) {
  try {
    const client = getRedisClient();
    if (!client || client.status !== 'ready') return false;
    
    await client.del(key);
    return true;
  } catch (error) {
    logger.error({ error, key }, 'Cache delete error');
    return false;
  }
}

export async function cacheIncr(key, ttlSeconds = 3600) {
  try {
    const client = getRedisClient();
    if (!client || client.status !== 'ready') return 0;
    
    const value = await client.incr(key);
    if (value === 1) {
      await client.expire(key, ttlSeconds);
    }
    return value;
  } catch (error) {
    logger.error({ error, key }, 'Cache increment error');
    return 0;
  }
}

export default {
  getRedisClient,
  connectRedis,
  closeRedis,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheIncr
};
