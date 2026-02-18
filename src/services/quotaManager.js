import { RateLimiterPostgres } from "rate-limiter-flexible";
import { postgresClient } from "../utils/postgresClient.js";
import { AppError } from "../utils/errors.js";
import logger from "../utils/logger.js";
import crypto from "crypto";

export class QuotaManager {
  constructor() {
    this.rateLimiters = new Map();
  }

  async initialize() {
    if (!postgresClient.isConnected) {
      logger.warn("PostgreSQL not connected, quota management disabled");
      return;
    }

    // Create rate limiter for API requests (per API key)
    const pgClient = await postgresClient.getClient();
    
    this.requestLimiter = new RateLimiterPostgres({
      storeClient: pgClient,
      tableName: "rate_limiter_requests",
      keyPrefix: "rl_req",
      points: 100, // Number of requests
      duration: 60, // Per 60 seconds
    });

    logger.info("Quota manager initialized");
  }

  async validateApiKey(apiKey) {
    if (!apiKey) {
      throw new AppError("API key required", 401, "API_KEY_REQUIRED");
    }

    // Hash the API key for security
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    try {
      const result = await postgresClient.query(
        `SELECT id, key_prefix, user_id, is_active, daily_quota, monthly_quota, expires_at
        FROM api_keys
        WHERE key_hash = $1`,
        [keyHash]
      );

      if (result.rows.length === 0) {
        throw new AppError("Invalid API key", 401, "INVALID_API_KEY");
      }

      const keyData = result.rows[0];

      if (!keyData.is_active) {
        throw new AppError("API key is inactive", 403, "API_KEY_INACTIVE");
      }

      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        throw new AppError("API key has expired", 403, "API_KEY_EXPIRED");
      }

      return keyData;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error({ err }, "API key validation error");
      throw new AppError("API key validation failed", 500, "VALIDATION_ERROR");
    }
  }

  async checkRateLimit(apiKeyId) {
    if (!this.requestLimiter) {
      return { allowed: true };
    }

    try {
      const rateLimitRes = await this.requestLimiter.consume(apiKeyId);
      return {
        allowed: true,
        remainingPoints: rateLimitRes.remainingPoints,
        resetTime: new Date(Date.now() + rateLimitRes.msBeforeNext)
      };
    } catch (rateLimitErr) {
      if (rateLimitErr instanceof Error) {
        logger.error({ err: rateLimitErr }, "Rate limit check error");
        return { allowed: true }; // Fail open
      }
      
      // Rate limit exceeded
      return {
        allowed: false,
        retryAfter: Math.ceil(rateLimitErr.msBeforeNext / 1000)
      };
    }
  }

  async checkQuota(apiKeyId) {
    if (!postgresClient.isConnected) {
      return { allowed: true };
    }

    try {
      // Get API key quotas
      const keyResult = await postgresClient.query(
        `SELECT daily_quota, monthly_quota FROM api_keys WHERE id = $1`,
        [apiKeyId]
      );

      if (keyResult.rows.length === 0) {
        throw new AppError("API key not found", 404, "API_KEY_NOT_FOUND");
      }

      const { daily_quota, monthly_quota } = keyResult.rows[0];

      // Check daily usage
      const dailyResult = await postgresClient.query(
        `SELECT request_count FROM daily_usage 
        WHERE api_key_id = $1 AND usage_date = CURRENT_DATE`,
        [apiKeyId]
      );

      const dailyUsage = dailyResult.rows[0]?.request_count || 0;

      if (daily_quota && dailyUsage >= daily_quota) {
        return {
          allowed: false,
          reason: "daily_quota_exceeded",
          quota: daily_quota,
          used: dailyUsage
        };
      }

      // Check monthly usage
      const monthlyResult = await postgresClient.query(
        `SELECT SUM(request_count) as total FROM daily_usage 
        WHERE api_key_id = $1 
        AND usage_date >= date_trunc('month', CURRENT_DATE)`,
        [apiKeyId]
      );

      const monthlyUsage = parseInt(monthlyResult.rows[0]?.total || 0);

      if (monthly_quota && monthlyUsage >= monthly_quota) {
        return {
          allowed: false,
          reason: "monthly_quota_exceeded",
          quota: monthly_quota,
          used: monthlyUsage
        };
      }

      return {
        allowed: true,
        dailyUsed: dailyUsage,
        dailyQuota: daily_quota,
        monthlyUsed: monthlyUsage,
        monthlyQuota: monthly_quota
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error({ err }, "Quota check error");
      return { allowed: true }; // Fail open
    }
  }

  async createApiKey(userId, description, quotas = {}) {
    const apiKey = `bsu_${crypto.randomBytes(24).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    const keyPrefix = apiKey.substring(0, 12);

    const {
      daily_quota = 1000,
      monthly_quota = 30000,
      expires_at = null
    } = quotas;

    try {
      const result = await postgresClient.query(
        `INSERT INTO api_keys 
        (key_hash, key_prefix, user_id, description, daily_quota, monthly_quota, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, key_prefix, created_at`,
        [keyHash, keyPrefix, userId, description, daily_quota, monthly_quota, expires_at]
      );

      return {
        apiKey, // Only return the actual key once at creation
        id: result.rows[0].id,
        keyPrefix: result.rows[0].key_prefix,
        createdAt: result.rows[0].created_at
      };
    } catch (err) {
      logger.error({ err }, "Failed to create API key");
      throw new AppError("Failed to create API key", 500, "CREATE_KEY_ERROR");
    }
  }

  async revokeApiKey(apiKeyId) {
    try {
      await postgresClient.query(
        `UPDATE api_keys SET is_active = FALSE WHERE id = $1`,
        [apiKeyId]
      );
      return { success: true };
    } catch (err) {
      logger.error({ err }, "Failed to revoke API key");
      throw new AppError("Failed to revoke API key", 500, "REVOKE_KEY_ERROR");
    }
  }

  async listApiKeys(userId) {
    try {
      const result = await postgresClient.query(
        `SELECT id, key_prefix, description, is_active, daily_quota, monthly_quota, 
                created_at, expires_at
        FROM api_keys
        WHERE user_id = $1
        ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows;
    } catch (err) {
      logger.error({ err }, "Failed to list API keys");
      throw new AppError("Failed to list API keys", 500, "LIST_KEYS_ERROR");
    }
  }

  async getUsageStats(apiKeyId, startDate, endDate) {
    try {
      const result = await postgresClient.query(
        `SELECT 
          usage_date,
          request_count,
          tokens_total,
          cost_total_usd
        FROM daily_usage
        WHERE api_key_id = $1 
        AND usage_date BETWEEN $2 AND $3
        ORDER BY usage_date DESC`,
        [apiKeyId, startDate, endDate]
      );

      return result.rows;
    } catch (err) {
      logger.error({ err }, "Failed to get usage stats");
      throw new AppError("Failed to get usage stats", 500, "STATS_ERROR");
    }
  }
}

export const quotaManager = new QuotaManager();
