import crypto from 'crypto';
import { cacheGet, cacheSet } from '../../database/redis.js';
import { query } from '../../database/client.js';
import logger from '../../utils/logger.js';

const DEFAULT_TTL = 3600; // 1 hour
const MAX_CACHE_SIZE = 10000; // Maximum number of cached items

export class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.maxSize = MAX_CACHE_SIZE;
  }

  /**
   * Generate cache key from request parameters
   */
  generateCacheKey(model, messages) {
    const messageString = JSON.stringify(messages);
    const hash = crypto.createHash('sha256').update(messageString).digest('hex');
    return `gateway:${model}:${hash}`;
  }

  generatePromptHash(messages) {
    const messageString = JSON.stringify(messages);
    return crypto.createHash('sha256').update(messageString).digest('hex');
  }

  /**
   * Get cached response
   */
  async get(model, messages) {
    const cacheKey = this.generateCacheKey(model, messages);

    try {
      // Try Redis first
      const cached = await cacheGet(cacheKey);
      if (cached) {
        logger.debug({ cacheKey }, 'Cache hit (Redis)');
        await this.incrementHitCount(cacheKey);
        return cached;
      }

      // Fallback to memory cache
      const memoryCached = this.memoryCache.get(cacheKey);
      if (memoryCached && memoryCached.expiresAt > Date.now()) {
        logger.debug({ cacheKey }, 'Cache hit (memory)');
        return memoryCached.data;
      }

      logger.debug({ cacheKey }, 'Cache miss');
      return null;
    } catch (error) {
      logger.error({ error, cacheKey }, 'Cache get error');
      return null;
    }
  }

  /**
   * Store response in cache
   */
  async set(model, messages, response, ttl = DEFAULT_TTL) {
    const cacheKey = this.generateCacheKey(model, messages);
    const promptHash = this.generatePromptHash(messages);

    try {
      const cacheData = {
        response,
        model,
        cached_at: new Date().toISOString()
      };

      // Store in Redis
      await cacheSet(cacheKey, cacheData, ttl);

      // Store in memory cache (with size limit)
      if (this.memoryCache.size >= this.maxSize) {
        // Remove oldest entry
        const firstKey = this.memoryCache.keys().next().value;
        this.memoryCache.delete(firstKey);
      }

      this.memoryCache.set(cacheKey, {
        data: cacheData,
        expiresAt: Date.now() + (ttl * 1000)
      });

      // Store in database for analytics
      await this.saveCacheEntry(cacheKey, promptHash, model, response, ttl);

      logger.debug({ cacheKey, ttl }, 'Response cached');
    } catch (error) {
      logger.error({ error, cacheKey }, 'Cache set error');
    }
  }

  async saveCacheEntry(cacheKey, promptHash, model, response, ttl) {
    try {
      const tokensSaved = response.usage?.total_tokens || 0;
      const expiresAt = new Date(Date.now() + ttl * 1000);

      await query(
        `INSERT INTO gateway_cache 
         (cache_key, prompt_hash, model, response, tokens_saved, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (cache_key) DO UPDATE SET
           hit_count = gateway_cache.hit_count + 1,
           last_accessed_at = CURRENT_TIMESTAMP`,
        [cacheKey, promptHash, model, JSON.stringify(response), tokensSaved, expiresAt]
      );
    } catch (error) {
      logger.warn({ error }, 'Failed to save cache entry to database');
    }
  }

  async incrementHitCount(cacheKey) {
    try {
      await query(
        `UPDATE gateway_cache 
         SET hit_count = hit_count + 1,
             last_accessed_at = CURRENT_TIMESTAMP
         WHERE cache_key = $1`,
        [cacheKey]
      );
    } catch (error) {
      logger.warn({ error }, 'Failed to increment cache hit count');
    }
  }

  /**
   * Clear all caches
   */
  async clear() {
    this.memoryCache.clear();
    logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const result = await query('SELECT * FROM gateway_cache_stats');
      return result.rows[0] || {
        total_entries: 0,
        total_hits: 0,
        total_tokens_saved: 0,
        total_cost_saved: 0,
        active_entries: 0,
        expired_entries: 0
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get cache stats');
      return {
        total_entries: this.memoryCache.size,
        total_hits: 0,
        total_tokens_saved: 0,
        total_cost_saved: 0,
        active_entries: this.memoryCache.size,
        expired_entries: 0
      };
    }
  }

  /**
   * Clean expired entries
   */
  async cleanExpired() {
    try {
      // Clean memory cache
      const now = Date.now();
      for (const [key, value] of this.memoryCache.entries()) {
        if (value.expiresAt <= now) {
          this.memoryCache.delete(key);
        }
      }

      // Clean database cache
      await query('DELETE FROM gateway_cache WHERE expires_at <= CURRENT_TIMESTAMP');
      
      logger.info('Expired cache entries cleaned');
    } catch (error) {
      logger.error({ error }, 'Failed to clean expired cache');
    }
  }
}

export const cacheManager = new CacheManager();

// Clean expired entries every hour
setInterval(() => {
  cacheManager.cleanExpired().catch(err => 
    logger.error({ err }, 'Scheduled cache cleanup failed')
  );
}, 3600000);
