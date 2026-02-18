import { query } from '../../database/client.js';
import { cacheIncr } from '../../database/redis.js';
import logger from '../../utils/logger.js';
import { AppError } from '../../utils/errors.js';
import crypto from 'crypto';

export class RateLimiter {
  constructor() {
    this.memoryLimits = new Map();
  }

  /**
   * Check if request is within rate limit
   */
  async checkLimit(apiKeyHash, limit, windowSeconds = 3600) {
    try {
      // Try Redis first for distributed rate limiting
      const redisKey = `ratelimit:${apiKeyHash}:${this.getWindowStart(windowSeconds)}`;
      const count = await cacheIncr(redisKey, windowSeconds);
      
      if (count > limit) {
        logger.warn({ apiKeyHash, count, limit }, 'Rate limit exceeded (Redis)');
        throw new AppError(
          `Rate limit exceeded. Limit: ${limit} requests per ${windowSeconds} seconds`,
          429,
          'RATE_LIMIT_EXCEEDED',
          { limit, window: windowSeconds, current: count }
        );
      }

      // Also track in database for analytics
      await this.trackInDatabase(apiKeyHash, windowSeconds);

      return {
        allowed: true,
        remaining: Math.max(0, limit - count),
        reset: this.getWindowEnd(windowSeconds)
      };
    } catch (error) {
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        throw error;
      }

      // Fallback to memory-based rate limiting
      logger.warn({ error: error.message }, 'Redis rate limit failed, using memory fallback');
      return this.checkMemoryLimit(apiKeyHash, limit, windowSeconds);
    }
  }

  checkMemoryLimit(apiKeyHash, limit, windowSeconds) {
    const now = Date.now();
    const windowStart = this.getWindowStart(windowSeconds) * 1000;
    
    if (!this.memoryLimits.has(apiKeyHash)) {
      this.memoryLimits.set(apiKeyHash, []);
    }

    const requests = this.memoryLimits.get(apiKeyHash);
    
    // Remove requests outside current window
    const validRequests = requests.filter(timestamp => timestamp >= windowStart);
    this.memoryLimits.set(apiKeyHash, validRequests);

    if (validRequests.length >= limit) {
      logger.warn({ apiKeyHash, count: validRequests.length, limit }, 'Rate limit exceeded (memory)');
      throw new AppError(
        `Rate limit exceeded. Limit: ${limit} requests per ${windowSeconds} seconds`,
        429,
        'RATE_LIMIT_EXCEEDED',
        { limit, window: windowSeconds, current: validRequests.length }
      );
    }

    // Add current request
    validRequests.push(now);
    this.memoryLimits.set(apiKeyHash, validRequests);

    return {
      allowed: true,
      remaining: Math.max(0, limit - validRequests.length),
      reset: windowStart + (windowSeconds * 1000)
    };
  }

  async trackInDatabase(apiKeyHash, windowSeconds) {
    try {
      const windowStart = new Date(this.getWindowStart(windowSeconds) * 1000);
      
      // Get API key ID from hash
      const keyResult = await query(
        'SELECT id FROM gateway_api_keys WHERE key_hash = $1',
        [apiKeyHash]
      );

      if (keyResult.rows.length === 0) {
        return;
      }

      const apiKeyId = keyResult.rows[0].id;

      await query(
        `INSERT INTO gateway_rate_limits (api_key_id, window_start, request_count, token_count)
         VALUES ($1, $2, 1, 0)
         ON CONFLICT (api_key_id, window_start)
         DO UPDATE SET request_count = gateway_rate_limits.request_count + 1`,
        [apiKeyId, windowStart]
      );
    } catch (error) {
      logger.warn({ error }, 'Failed to track rate limit in database');
    }
  }

  getWindowStart(windowSeconds) {
    return Math.floor(Date.now() / 1000 / windowSeconds) * windowSeconds;
  }

  getWindowEnd(windowSeconds) {
    return (this.getWindowStart(windowSeconds) + windowSeconds) * 1000;
  }

  /**
   * Verify API key and get limits
   */
  async verifyApiKey(apiKey) {
    if (!apiKey) {
      throw new AppError('API key is required', 401, 'MISSING_API_KEY');
    }

    const keyHash = this.hashApiKey(apiKey);
    
    try {
      const result = await query(
        `SELECT id, user_id, name, enabled, rate_limit, rate_limit_window, expires_at
         FROM gateway_api_keys
         WHERE key_hash = $1`,
        [keyHash]
      );

      if (result.rows.length === 0) {
        throw new AppError('Invalid API key', 401, 'INVALID_API_KEY');
      }

      const keyData = result.rows[0];

      if (!keyData.enabled) {
        throw new AppError('API key is disabled', 403, 'API_KEY_DISABLED');
      }

      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        throw new AppError('API key has expired', 403, 'API_KEY_EXPIRED');
      }

      // Update last used timestamp
      await query(
        'UPDATE gateway_api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1',
        [keyData.id]
      );

      return {
        id: keyData.id,
        userId: keyData.user_id,
        name: keyData.name,
        rateLimit: keyData.rate_limit,
        rateLimitWindow: keyData.rate_limit_window,
        keyHash
      };
    } catch (error) {
      if (error.code && error.code.startsWith('API_KEY')) {
        throw error;
      }
      
      logger.warn({ error: error.message }, 'API key verification failed, allowing request');
      // Fallback: allow request if database is unavailable
      return {
        id: null,
        userId: 'anonymous',
        name: 'anonymous',
        rateLimit: 100,
        rateLimitWindow: 3600,
        keyHash
      };
    }
  }

  /**
   * Generate new API key
   */
  async generateApiKey(userId, name, options = {}) {
    const {
      rateLimit = 1000,
      rateLimitWindow = 3600,
      expiresInDays = null
    } = options;

    // Generate secure random key
    const apiKey = `gw_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = this.hashApiKey(apiKey);
    const keyPrefix = apiKey.substring(0, 10);
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null;

    await query(
      `INSERT INTO gateway_api_keys 
       (key_hash, key_prefix, user_id, name, rate_limit, rate_limit_window, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [keyHash, keyPrefix, userId, name, rateLimit, rateLimitWindow, expiresAt]
    );

    logger.info({ userId, name, keyPrefix }, 'Generated new API key');

    return {
      apiKey,
      keyPrefix,
      rateLimit,
      rateLimitWindow,
      expiresAt
    };
  }

  hashApiKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * Get API key usage statistics
   */
  async getUsageStats(apiKeyHash, days = 7) {
    try {
      const keyResult = await query(
        'SELECT id FROM gateway_api_keys WHERE key_hash = $1',
        [apiKeyHash]
      );

      if (keyResult.rows.length === 0) {
        return null;
      }

      const apiKeyId = keyResult.rows[0].id;
      const sinceDate = new Date(Date.now() - days * 86400000);

      const result = await query(
        `SELECT 
           COUNT(*) as total_requests,
           SUM(total_tokens) as total_tokens,
           SUM(cost_usd) as total_cost,
           AVG(duration_ms) as avg_duration,
           COUNT(*) FILTER (WHERE status = 'success') as success_count,
           COUNT(*) FILTER (WHERE status = 'error') as error_count,
           COUNT(*) FILTER (WHERE status = 'cached') as cached_count
         FROM gateway_requests
         WHERE api_key_id = $1 AND created_at >= $2`,
        [apiKeyId, sinceDate]
      );

      return result.rows[0];
    } catch (error) {
      logger.error({ error }, 'Failed to get usage stats');
      return null;
    }
  }
}

export const rateLimiter = new RateLimiter();
