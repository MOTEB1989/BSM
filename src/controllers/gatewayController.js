import { unifiedGateway } from '../services/gateway/unifiedGateway.js';
import { providerRegistry } from '../services/gateway/providerRegistry.js';
import { rateLimiter } from '../services/gateway/rateLimiter.js';
import { requestLogger } from '../services/gateway/requestLogger.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

/**
 * POST /api/gateway/chat
 * Main unified gateway endpoint
 */
export async function gatewayChat(req, res, next) {
  try {
    // Extract API key from header or body
    const apiKey = req.headers['x-api-key'] || req.body.apiKey;

    const {
      messages,
      model = 'gpt-4o-mini',
      temperature = 0.7,
      max_tokens = 1024,
      stream = false,
      task_type = 'chat',
      cost_optimize = false,
      use_cache = true,
      preferred_provider = null
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      throw new AppError('Messages array is required', 400);
    }

    const request = {
      messages,
      model,
      temperature,
      max_tokens,
      stream
    };

    const options = {
      apiKey,
      taskType: task_type,
      costOptimize: cost_optimize,
      useCache: use_cache,
      preferredProvider: preferred_provider
    };

    const result = await unifiedGateway.chat(request, options);

    res.json({
      success: true,
      data: {
        requestId: result.requestId,
        response: result.response,
        usage: result.usage,
        cost: result.cost,
        provider: result.provider,
        cached: result.cached,
        fallbackChain: result.fallbackChain,
        attemptCount: result.attemptCount,
        duration: result.duration
      },
      rateLimit: result.rateLimitInfo
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/gateway/providers
 * List available providers
 */
export async function listProviders(req, res, next) {
  try {
    const providers = await unifiedGateway.getProviders();
    
    const providersWithStatus = providers.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      priority: p.priority,
      available: providerRegistry.hasApiKey(p.type)
    }));

    res.json({
      success: true,
      data: providersWithStatus
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/gateway/models
 * List available models
 */
export async function listModels(req, res, next) {
  try {
    const models = await unifiedGateway.getModels();

    res.json({
      success: true,
      data: models
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/gateway/usage
 * Get usage statistics for API key
 */
export async function getUsage(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      throw new AppError('API key is required', 401);
    }

    const days = parseInt(req.query.days) || 7;
    const usage = await unifiedGateway.getUsage(apiKey, days);

    if (!usage) {
      throw new AppError('No usage data found', 404);
    }

    res.json({
      success: true,
      data: usage,
      period: `${days} days`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/gateway/test
 * Test all providers
 */
export async function testProviders(req, res, next) {
  try {
    const results = await unifiedGateway.testProviders();

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/gateway/stats
 * Get gateway statistics (public)
 */
export async function getStats(req, res, next) {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const stats = await unifiedGateway.getStats(hours);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
}

// ==================== ADMIN ENDPOINTS ====================

/**
 * GET /api/gateway/admin/providers
 * List all providers (admin)
 */
export async function adminListProviders(req, res, next) {
  try {
    const providers = await providerRegistry.getAllProviders();

    const providersWithDetails = providers.map(p => ({
      ...p,
      hasApiKey: providerRegistry.hasApiKey(p.type),
      apiKeySource: providerRegistry.hasApiKey(p.type) ? 
        `${p.type.toUpperCase()}_API_KEY` : null
    }));

    res.json({
      success: true,
      data: providersWithDetails
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/gateway/admin/providers
 * Add new provider (admin)
 */
export async function adminAddProvider(req, res, next) {
  try {
    const { name, type, apiUrl, priority, enabled, config } = req.body;

    if (!name || !type || !apiUrl) {
      throw new AppError('Name, type, and apiUrl are required', 400);
    }

    const validTypes = ['openai', 'anthropic', 'google', 'kimi', 'perplexity'];
    if (!validTypes.includes(type)) {
      throw new AppError(`Invalid provider type. Must be one of: ${validTypes.join(', ')}`, 400);
    }

    const provider = await providerRegistry.addProvider({
      name,
      type,
      apiUrl,
      priority: priority || 50,
      enabled: enabled !== false,
      config: config || {}
    });

    res.json({
      success: true,
      data: provider
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/gateway/admin/providers/:id
 * Update provider (admin)
 */
export async function adminUpdateProvider(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const provider = await providerRegistry.updateProvider(parseInt(id), updates);

    res.json({
      success: true,
      data: provider
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/gateway/admin/providers/:id
 * Delete provider (admin)
 */
export async function adminDeleteProvider(req, res, next) {
  try {
    const { id } = req.params;

    await providerRegistry.deleteProvider(parseInt(id));

    res.json({
      success: true,
      message: 'Provider deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/gateway/admin/keys
 * Generate new API key (admin)
 */
export async function adminGenerateKey(req, res, next) {
  try {
    const {
      userId,
      name,
      rateLimit = 1000,
      rateLimitWindow = 3600,
      expiresInDays = null
    } = req.body;

    if (!userId || !name) {
      throw new AppError('userId and name are required', 400);
    }

    const apiKeyData = await unifiedGateway.generateApiKey(userId, name, {
      rateLimit,
      rateLimitWindow,
      expiresInDays
    });

    res.json({
      success: true,
      data: apiKeyData,
      warning: 'Store this API key securely. It will not be shown again.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/gateway/admin/stats
 * Get detailed gateway statistics (admin)
 */
export async function adminGetStats(req, res, next) {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const stats = await unifiedGateway.getStats(hours);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/gateway/admin/requests
 * Get recent requests (admin)
 */
export async function adminGetRequests(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const requests = await requestLogger.getRecentRequests(limit, offset);

    res.json({
      success: true,
      data: requests,
      pagination: {
        limit,
        offset
      }
    });
  } catch (error) {
    next(error);
  }
}
