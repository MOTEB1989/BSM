import { query } from '../../database/client.js';
import logger from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export class RequestLogger {
  /**
   * Log gateway request
   */
  async logRequest(data) {
    const {
      requestId = uuidv4(),
      apiKeyId = null,
      providerId,
      model,
      taskType = 'chat',
      promptTokens = 0,
      completionTokens = 0,
      totalTokens = 0,
      costUsd = 0,
      durationMs,
      status,
      errorMessage = null,
      fallbackChain = []
    } = data;

    try {
      await query(
        `INSERT INTO gateway_requests 
         (request_id, api_key_id, provider_id, model, task_type, 
          prompt_tokens, completion_tokens, total_tokens, cost_usd, 
          duration_ms, status, error_message, fallback_chain)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          requestId,
          apiKeyId,
          providerId,
          model,
          taskType,
          promptTokens,
          completionTokens,
          totalTokens,
          costUsd,
          durationMs,
          status,
          errorMessage,
          fallbackChain
        ]
      );

      logger.info({
        requestId,
        model,
        status,
        tokens: totalTokens,
        cost: costUsd,
        duration: durationMs
      }, 'Request logged');

      return requestId;
    } catch (error) {
      logger.error({ error, data }, 'Failed to log request');
      return requestId;
    }
  }

  /**
   * Get request statistics
   */
  async getStats(options = {}) {
    const {
      apiKeyId = null,
      providerId = null,
      model = null,
      hours = 24
    } = options;

    try {
      const conditions = ['created_at >= NOW() - INTERVAL \'1 hour\' * $1'];
      const params = [hours];
      let paramCount = 1;

      if (apiKeyId) {
        conditions.push(`api_key_id = $${++paramCount}`);
        params.push(apiKeyId);
      }

      if (providerId) {
        conditions.push(`provider_id = $${++paramCount}`);
        params.push(providerId);
      }

      if (model) {
        conditions.push(`model = $${++paramCount}`);
        params.push(model);
      }

      const whereClause = conditions.join(' AND ');

      const result = await query(
        `SELECT 
           COUNT(*) as total_requests,
           SUM(prompt_tokens) as total_prompt_tokens,
           SUM(completion_tokens) as total_completion_tokens,
           SUM(total_tokens) as total_tokens,
           SUM(cost_usd) as total_cost,
           AVG(duration_ms) as avg_duration,
           MIN(duration_ms) as min_duration,
           MAX(duration_ms) as max_duration,
           COUNT(*) FILTER (WHERE status = 'success') as success_count,
           COUNT(*) FILTER (WHERE status = 'error') as error_count,
           COUNT(*) FILTER (WHERE status = 'cached') as cached_count,
           COUNT(*) FILTER (WHERE status = 'fallback') as fallback_count
         FROM gateway_requests
         WHERE ${whereClause}`,
        params
      );

      return result.rows[0];
    } catch (error) {
      logger.error({ error }, 'Failed to get request stats');
      return null;
    }
  }

  /**
   * Get usage by model
   */
  async getUsageByModel(hours = 24) {
    try {
      const result = await query(
        `SELECT 
           model,
           COUNT(*) as request_count,
           SUM(total_tokens) as total_tokens,
           SUM(cost_usd) as total_cost,
           AVG(duration_ms) as avg_duration
         FROM gateway_requests
         WHERE created_at >= NOW() - INTERVAL '1 hour' * $1
         GROUP BY model
         ORDER BY request_count DESC`,
        [hours]
      );

      return result.rows;
    } catch (error) {
      logger.error({ error }, 'Failed to get usage by model');
      return [];
    }
  }

  /**
   * Get usage by provider
   */
  async getUsageByProvider(hours = 24) {
    try {
      const result = await query(
        `SELECT 
           p.name as provider_name,
           p.type as provider_type,
           COUNT(r.*) as request_count,
           SUM(r.total_tokens) as total_tokens,
           SUM(r.cost_usd) as total_cost,
           AVG(r.duration_ms) as avg_duration,
           COUNT(*) FILTER (WHERE r.status = 'error') as error_count
         FROM gateway_requests r
         JOIN gateway_providers p ON r.provider_id = p.id
         WHERE r.created_at >= NOW() - INTERVAL '1 hour' * $1
         GROUP BY p.id, p.name, p.type
         ORDER BY request_count DESC`,
        [hours]
      );

      return result.rows;
    } catch (error) {
      logger.error({ error }, 'Failed to get usage by provider');
      return [];
    }
  }

  /**
   * Get recent requests
   */
  async getRecentRequests(limit = 100, offset = 0) {
    try {
      const result = await query(
        `SELECT 
           r.request_id,
           r.model,
           r.task_type,
           r.status,
           r.total_tokens,
           r.cost_usd,
           r.duration_ms,
           r.created_at,
           p.name as provider_name,
           k.key_prefix,
           k.user_id
         FROM gateway_requests r
         LEFT JOIN gateway_providers p ON r.provider_id = p.id
         LEFT JOIN gateway_api_keys k ON r.api_key_id = k.id
         ORDER BY r.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return result.rows;
    } catch (error) {
      logger.error({ error }, 'Failed to get recent requests');
      return [];
    }
  }

  /**
   * Get error rate
   */
  async getErrorRate(hours = 24) {
    try {
      const result = await query(
        `SELECT 
           COUNT(*) FILTER (WHERE status = 'error') * 100.0 / NULLIF(COUNT(*), 0) as error_rate,
           COUNT(*) FILTER (WHERE status = 'error') as error_count,
           COUNT(*) as total_count
         FROM gateway_requests
         WHERE created_at >= NOW() - INTERVAL '1 hour' * $1`,
        [hours]
      );

      return result.rows[0];
    } catch (error) {
      logger.error({ error }, 'Failed to get error rate');
      return { error_rate: 0, error_count: 0, total_count: 0 };
    }
  }
}

export const requestLogger = new RequestLogger();
