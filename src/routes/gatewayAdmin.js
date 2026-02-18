import { Router } from "express";
import { quotaManager } from "../services/quotaManager.js";
import { postgresClient } from "../utils/postgresClient.js";
import { AppError } from "../utils/errors.js";
import logger from "../utils/logger.js";

const router = Router();

// Admin authentication middleware (uses existing admin token)
const requireAdmin = (req, res, next) => {
  const token = req.headers["x-admin-token"];
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken || token !== adminToken) {
    throw new AppError("Unauthorized", 403, "UNAUTHORIZED");
  }

  next();
};

router.use(requireAdmin);

// Create new API key
router.post("/api-keys", async (req, res, next) => {
  try {
    const { user_id, description, daily_quota, monthly_quota, expires_at } = req.body;

    if (!user_id) {
      throw new AppError("user_id is required", 400, "MISSING_USER_ID");
    }

    const result = await quotaManager.createApiKey(user_id, description, {
      daily_quota,
      monthly_quota,
      expires_at
    });

    res.json({
      success: true,
      apiKey: result.apiKey,
      id: result.id,
      keyPrefix: result.keyPrefix,
      createdAt: result.createdAt,
      warning: "Store this API key securely. It will not be shown again."
    });
  } catch (err) {
    next(err);
  }
});

// List all API keys
router.get("/api-keys", async (req, res, next) => {
  try {
    const { user_id } = req.query;

    let query = `
      SELECT 
        ak.id,
        ak.key_prefix,
        ak.user_id,
        ak.description,
        ak.is_active,
        ak.daily_quota,
        ak.monthly_quota,
        ak.created_at,
        ak.expires_at,
        COALESCE(du.request_count, 0) as today_requests,
        COALESCE(du.cost_total_usd, 0) as today_cost
      FROM api_keys ak
      LEFT JOIN daily_usage du ON ak.id = du.api_key_id AND du.usage_date = CURRENT_DATE
    `;

    const params = [];
    if (user_id) {
      query += ` WHERE ak.user_id = $1`;
      params.push(user_id);
    }

    query += ` ORDER BY ak.created_at DESC`;

    const result = await postgresClient.query(query, params);

    res.json({
      success: true,
      apiKeys: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    next(err);
  }
});

// Get API key details with usage stats
router.get("/api-keys/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const keyResult = await postgresClient.query(
      `SELECT * FROM api_keys WHERE id = $1`,
      [id]
    );

    if (keyResult.rows.length === 0) {
      throw new AppError("API key not found", 404, "KEY_NOT_FOUND");
    }

    const usageResult = await postgresClient.query(
      `SELECT 
        usage_date,
        request_count,
        tokens_total,
        cost_total_usd
      FROM daily_usage
      WHERE api_key_id = $1
      AND usage_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY usage_date DESC`,
      [id]
    );

    res.json({
      success: true,
      apiKey: keyResult.rows[0],
      usage: usageResult.rows
    });
  } catch (err) {
    next(err);
  }
});

// Update API key
router.patch("/api-keys/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, daily_quota, monthly_quota, is_active, expires_at } = req.body;

    const updates = [];
    const params = [id];
    let paramIndex = 2;

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    if (daily_quota !== undefined) {
      updates.push(`daily_quota = $${paramIndex++}`);
      params.push(daily_quota);
    }
    if (monthly_quota !== undefined) {
      updates.push(`monthly_quota = $${paramIndex++}`);
      params.push(monthly_quota);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(is_active);
    }
    if (expires_at !== undefined) {
      updates.push(`expires_at = $${paramIndex++}`);
      params.push(expires_at);
    }

    if (updates.length === 0) {
      throw new AppError("No fields to update", 400, "NO_UPDATES");
    }

    await postgresClient.query(
      `UPDATE api_keys SET ${updates.join(", ")} WHERE id = $1`,
      params
    );

    res.json({ success: true, message: "API key updated" });
  } catch (err) {
    next(err);
  }
});

// Revoke API key
router.delete("/api-keys/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await quotaManager.revokeApiKey(id);
    res.json({ success: true, message: "API key revoked" });
  } catch (err) {
    next(err);
  }
});

// Provider management - list all providers
router.get("/providers", async (req, res, next) => {
  try {
    const result = await postgresClient.query(
      `SELECT * FROM providers ORDER BY priority ASC`
    );

    res.json({
      success: true,
      providers: result.rows
    });
  } catch (err) {
    next(err);
  }
});

// Update provider configuration
router.patch("/providers/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active, priority, max_retries, timeout_ms, config } = req.body;

    const updates = [];
    const params = [id];
    let paramIndex = 2;

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(is_active);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      params.push(priority);
    }
    if (max_retries !== undefined) {
      updates.push(`max_retries = $${paramIndex++}`);
      params.push(max_retries);
    }
    if (timeout_ms !== undefined) {
      updates.push(`timeout_ms = $${paramIndex++}`);
      params.push(timeout_ms);
    }
    if (config !== undefined) {
      updates.push(`config = $${paramIndex++}`);
      params.push(JSON.stringify(config));
    }

    if (updates.length === 0) {
      throw new AppError("No fields to update", 400, "NO_UPDATES");
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    await postgresClient.query(
      `UPDATE providers SET ${updates.join(", ")} WHERE id = $1`,
      params
    );

    res.json({ success: true, message: "Provider updated" });
  } catch (err) {
    next(err);
  }
});

// Usage analytics
router.get("/analytics/usage", async (req, res, next) => {
  try {
    const { start_date, end_date, group_by = "day" } = req.query;

    const result = await postgresClient.query(
      `SELECT 
        DATE(created_at) as date,
        provider,
        COUNT(*) as request_count,
        SUM(tokens_total) as total_tokens,
        SUM(cost_usd) as total_cost,
        AVG(response_time_ms) as avg_response_time
      FROM usage_logs
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY DATE(created_at), provider
      ORDER BY date DESC, provider`,
      [start_date || "2024-01-01", end_date || new Date().toISOString()]
    );

    res.json({
      success: true,
      analytics: result.rows,
      period: { start: start_date, end: end_date }
    });
  } catch (err) {
    next(err);
  }
});

// Top users by usage
router.get("/analytics/top-users", async (req, res, next) => {
  try {
    const { limit = 10, metric = "requests" } = req.query;

    let orderBy;
    switch (metric) {
      case "cost":
        orderBy = "total_cost";
        break;
      case "tokens":
        orderBy = "total_tokens";
        break;
      default:
        orderBy = "total_requests";
    }

    const result = await postgresClient.query(
      `SELECT 
        ak.user_id,
        ak.key_prefix,
        COUNT(ul.id) as total_requests,
        SUM(ul.tokens_total) as total_tokens,
        SUM(ul.cost_usd) as total_cost,
        MAX(ul.created_at) as last_request
      FROM api_keys ak
      JOIN usage_logs ul ON ak.id = ul.api_key_id
      WHERE ul.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY ak.id, ak.user_id, ak.key_prefix
      ORDER BY ${orderBy} DESC
      LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      topUsers: result.rows,
      metric,
      limit: parseInt(limit)
    });
  } catch (err) {
    next(err);
  }
});

// Model pricing management
router.get("/pricing", async (req, res, next) => {
  try {
    const result = await postgresClient.query(
      `SELECT * FROM model_pricing ORDER BY provider, model`
    );

    res.json({
      success: true,
      pricing: result.rows
    });
  } catch (err) {
    next(err);
  }
});

router.put("/pricing/:provider/:model", async (req, res, next) => {
  try {
    const { provider, model } = req.params;
    const { input_cost_per_1m, output_cost_per_1m } = req.body;

    await postgresClient.query(
      `INSERT INTO model_pricing (provider, model, input_cost_per_1m, output_cost_per_1m)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (provider, model) 
      DO UPDATE SET 
        input_cost_per_1m = $3,
        output_cost_per_1m = $4,
        updated_at = CURRENT_TIMESTAMP`,
      [provider, model, input_cost_per_1m, output_cost_per_1m]
    );

    res.json({ success: true, message: "Pricing updated" });
  } catch (err) {
    next(err);
  }
});

// System health
router.get("/health", async (req, res, next) => {
  try {
    const dbConnected = postgresClient.isConnected;
    const redisConnected = require("../utils/redisClient.js").redisClient.isConnected;

    const providersResult = await postgresClient.query(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active
      FROM providers`
    );

    const keysResult = await postgresClient.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active
      FROM api_keys`
    );

    res.json({
      success: true,
      health: {
        database: dbConnected ? "connected" : "disconnected",
        redis: redisConnected ? "connected" : "disconnected",
        providers: providersResult.rows[0],
        apiKeys: keysResult.rows[0]
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
