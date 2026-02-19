import logger from '../../utils/logger.js';
import { AppError } from '../../utils/errors.js';
import { providerRegistry } from './providerRegistry.js';
import { requestTransformer } from './requestTransformer.js';

export class FallbackManager {
  constructor() {
    this.maxRetries = 3;
    this.fallbackChain = [];
  }

  /**
   * Execute request with automatic fallback
   */
  async executeWithFallback(standardRequest, options = {}) {
    const { preferredProviderId, taskType = 'chat', costOptimize = false } = options;
    
    let providersToTry = [];
    const fallbackChain = [];
    const errors = [];

    // Determine provider order
    if (costOptimize) {
      // Use cheapest model first
      const cheapest = providerRegistry.getCheapestModel(taskType);
      const providerType = providerRegistry.getProviderTypeFromModel(cheapest.model);
      providersToTry = await providerRegistry.getProvidersByType(providerType);
      
      // Override model in request
      standardRequest.model = cheapest.model;
    } else if (preferredProviderId) {
      // Try preferred provider first
      const preferred = await providerRegistry.getProvider(preferredProviderId);
      if (preferred) {
        providersToTry.push(preferred);
      }
    }

    // Add all other available providers as fallbacks
    const allProviders = await providerRegistry.getAllProviders();
    const availableProviders = allProviders.filter(p => 
      providerRegistry.hasApiKey(p.type) &&
      !providersToTry.find(pt => pt.id === p.id)
    );
    
    providersToTry = [...providersToTry, ...availableProviders];

    if (providersToTry.length === 0) {
      throw new AppError('No available providers configured', 503, 'NO_PROVIDERS');
    }

    // Try each provider in order
    for (const provider of providersToTry) {
      try {
        fallbackChain.push(provider.name);
        logger.info({ provider: provider.name, attempt: fallbackChain.length }, 'Attempting provider');

        const apiKey = providerRegistry.getApiKey(provider.type);
        if (!apiKey) {
          throw new AppError(`No API key for provider type: ${provider.type}`, 503);
        }

        // Transform request to provider format
        const providerRequest = requestTransformer.transformRequest(provider, standardRequest);

        // Make request
        const startTime = Date.now();
        const providerResponse = await requestTransformer.makeRequest(
          provider,
          apiKey,
          providerRequest
        );
        const duration = Date.now() - startTime;

        // Transform response to standard format
        const standardResponse = requestTransformer.transformResponse(provider, providerResponse);

        logger.info({ 
          provider: provider.name, 
          duration, 
          tokens: standardResponse.usage.total_tokens 
        }, 'Provider request succeeded');

        return {
          success: true,
          response: standardResponse,
          provider: provider,
          fallbackChain,
          duration,
          attemptCount: fallbackChain.length
        };

      } catch (error) {
        logger.warn({ 
          provider: provider.name, 
          error: error.message,
          code: error.code 
        }, 'Provider request failed');

        errors.push({
          provider: provider.name,
          error: error.message,
          code: error.code
        });

        // Don't retry on client errors (4xx)
        if (error.statusCode >= 400 && error.statusCode < 500) {
          logger.info('Client error detected, stopping fallback chain');
          break;
        }

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    logger.error({ errors, fallbackChain }, 'All providers failed');
    throw new AppError(
      'Service temporarily unavailable. Please try again later.',
      503,
      'ALL_PROVIDERS_FAILED'
    );
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    const retryableStatuses = [429, 500, 502, 503, 504];
    const retryableCodes = ['TIMEOUT', 'ECONNRESET', 'ETIMEDOUT', 'PROVIDER_ERROR'];
    
    return (
      retryableStatuses.includes(error.statusCode) ||
      retryableCodes.includes(error.code)
    );
  }

  /**
   * Get recommended fallback provider
   */
  async getNextProvider(currentProviderId, excludeIds = []) {
    const excludedIds = [...excludeIds, currentProviderId];
    return await providerRegistry.getProviderByPriority(excludedIds);
  }

  /**
   * Test all providers
   */
  async testAllProviders() {
    const providers = await providerRegistry.getAllProviders();
    const results = [];

    const testRequest = {
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "test successful" and nothing else.' }
      ],
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 10
    };

    for (const provider of providers) {
      const apiKey = providerRegistry.getApiKey(provider.type);
      
      if (!apiKey) {
        results.push({
          provider: provider.name,
          status: 'no_api_key',
          available: false
        });
        continue;
      }

      try {
        const providerRequest = requestTransformer.transformRequest(provider, testRequest);
        const startTime = Date.now();
        
        await requestTransformer.makeRequest(provider, apiKey, providerRequest);
        
        const duration = Date.now() - startTime;
        
        results.push({
          provider: provider.name,
          status: 'success',
          available: true,
          responseTime: duration
        });
      } catch (error) {
        results.push({
          provider: provider.name,
          status: 'error',
          available: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

export const fallbackManager = new FallbackManager();
