import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger.js';
import { AppError } from '../../utils/errors.js';
import { providerRegistry } from './providerRegistry.js';
import { fallbackManager } from './fallbackManager.js';
import { cacheManager } from './cacheManager.js';
import { rateLimiter } from './rateLimiter.js';
import { requestLogger } from './requestLogger.js';

export class UnifiedGatewayService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await providerRegistry.loadProviders();
      this.initialized = true;
      logger.info('Unified Gateway Service initialized');
    } catch (error) {
      logger.warn({ error: error.message }, 'Failed to initialize gateway service');
      // Continue anyway - services will work with defaults
      this.initialized = true;
    }
  }

  /**
   * Main gateway method - handles all requests with caching, fallback, and logging
   */
  async chat(request, options = {}) {
    const startTime = Date.now();
    const requestId = uuidv4();

    const {
      apiKey = null,
      taskType = 'chat',
      costOptimize = false,
      useCache = true,
      preferredProvider = null
    } = options;

    let apiKeyData = null;
    let rateLimitInfo = null;

    try {
      // 1. Verify API key and check rate limits
      if (apiKey) {
        apiKeyData = await rateLimiter.verifyApiKey(apiKey);
        rateLimitInfo = await rateLimiter.checkLimit(
          apiKeyData.keyHash,
          apiKeyData.rateLimit,
          apiKeyData.rateLimitWindow
        );
      }

      // 2. Validate request
      this.validateRequest(request);

      // 3. Check cache first
      if (useCache) {
        const cached = await cacheManager.get(request.model, request.messages);
        if (cached) {
          const duration = Date.now() - startTime;

          // Log cached request
          await requestLogger.logRequest({
            requestId,
            apiKeyId: apiKeyData?.id,
            providerId: null,
            model: request.model,
            taskType,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            costUsd: 0,
            durationMs: duration,
            status: 'cached',
            fallbackChain: []
          });

          return {
            requestId,
            response: cached.response,
            cached: true,
            provider: null,
            duration,
            rateLimitInfo
          };
        }
      }

      // 4. Execute request with fallback
      const result = await fallbackManager.executeWithFallback(request, {
        preferredProviderId: preferredProvider,
        taskType,
        costOptimize
      });

      const duration = Date.now() - startTime;
      const { response, provider, fallbackChain, attemptCount } = result;

      // 5. Calculate cost
      const cost = providerRegistry.calculateCost(
        request.model,
        response.usage.prompt_tokens,
        response.usage.completion_tokens
      );

      // 6. Cache successful response
      if (useCache && response.content) {
        await cacheManager.set(request.model, request.messages, response);
      }

      // 7. Log request
      await requestLogger.logRequest({
        requestId,
        apiKeyId: apiKeyData?.id,
        providerId: provider.id,
        model: request.model,
        taskType,
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        costUsd: cost,
        durationMs: duration,
        status: attemptCount > 1 ? 'fallback' : 'success',
        fallbackChain
      });

      return {
        requestId,
        response: response.content,
        usage: response.usage,
        cost,
        provider: {
          id: provider.id,
          name: provider.name,
          type: provider.type
        },
        cached: false,
        fallbackChain,
        attemptCount,
        duration,
        rateLimitInfo
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      // Log failed request
      await requestLogger.logRequest({
        requestId,
        apiKeyId: apiKeyData?.id,
        providerId: null,
        model: request.model,
        taskType,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costUsd: 0,
        durationMs: duration,
        status: 'error',
        errorMessage: error.message,
        fallbackChain: error.metadata?.fallbackChain || []
      });

      throw error;
    }
  }

  validateRequest(request) {
    if (!request.messages || !Array.isArray(request.messages)) {
      throw new AppError('Messages array is required', 400, 'INVALID_REQUEST');
    }

    if (request.messages.length === 0) {
      throw new AppError('Messages array cannot be empty', 400, 'INVALID_REQUEST');
    }

    for (const msg of request.messages) {
      if (!msg.role || !msg.content) {
        throw new AppError('Each message must have role and content', 400, 'INVALID_REQUEST');
      }

      if (!['system', 'user', 'assistant'].includes(msg.role)) {
        throw new AppError('Invalid message role', 400, 'INVALID_REQUEST');
      }
    }

    if (!request.model) {
      request.model = 'gpt-4o-mini'; // Default model
    }

    if (!request.temperature) {
      request.temperature = 0.7;
    }

    if (!request.max_tokens) {
      request.max_tokens = 1024;
    }
  }

  /**
   * Get available providers
   */
  async getProviders() {
    return await providerRegistry.getAllProviders();
  }

  /**
   * Get available models
   */
  async getModels() {
    const providers = await providerRegistry.getAllProviders();
    const models = [];

    const providerModels = {
      openai: ['gpt-4', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
      anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      google: ['gemini-pro', 'gemini-pro-vision'],
      perplexity: ['sonar-small', 'sonar-medium', 'sonar-large'],
      kimi: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
    };

    for (const provider of providers) {
      const providerHasKey = providerRegistry.hasApiKey(provider.type);
      const modelList = providerModels[provider.type] || [];

      for (const model of modelList) {
        models.push({
          model,
          provider: provider.name,
          providerType: provider.type,
          available: providerHasKey
        });
      }
    }

    return models;
  }

  /**
   * Test all providers
   */
  async testProviders() {
    return await fallbackManager.testAllProviders();
  }

  /**
   * Get gateway statistics
   */
  async getStats(hours = 24) {
    const [requestStats, cacheStats, usageByModel, usageByProvider, errorRate] = await Promise.all([
      requestLogger.getStats({ hours }),
      cacheManager.getStats(),
      requestLogger.getUsageByModel(hours),
      requestLogger.getUsageByProvider(hours),
      requestLogger.getErrorRate(hours)
    ]);

    return {
      requests: requestStats,
      cache: cacheStats,
      usageByModel,
      usageByProvider,
      errorRate,
      period: `${hours} hours`
    };
  }

  /**
   * Generate new API key
   */
  async generateApiKey(userId, name, options = {}) {
    return await rateLimiter.generateApiKey(userId, name, options);
  }

  /**
   * Get usage for API key
   */
  async getUsage(apiKey, days = 7) {
    const keyHash = rateLimiter.hashApiKey(apiKey);
    return await rateLimiter.getUsageStats(keyHash, days);
  }
}

export const unifiedGateway = new UnifiedGatewayService();
