import fetch from "node-fetch";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import logger from "../utils/logger.js";
import { AppError } from "../utils/errors.js";
import { redisClient } from "../utils/redisClient.js";
import { postgresClient } from "../utils/postgresClient.js";
import crypto from "crypto";

const REQUEST_TIMEOUT_MS = 45000;

class AIProvider {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.circuitOpen = false;
    this.circuitOpenTime = null;
  }

  isAvailable() {
    if (!this.circuitOpen) return true;
    
    // Circuit breaker: reopen after 60 seconds
    const now = Date.now();
    if (now - this.circuitOpenTime > 60000) {
      this.circuitOpen = false;
      this.failureCount = 0;
      logger.info({ provider: this.name }, "Circuit breaker reset");
      return true;
    }
    
    return false;
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    // Open circuit after 3 consecutive failures
    if (this.failureCount >= 3) {
      this.circuitOpen = true;
      this.circuitOpenTime = Date.now();
      logger.warn({ provider: this.name }, "Circuit breaker opened");
    }
  }

  recordSuccess() {
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
}

export class UnifiedAIGateway {
  constructor() {
    this.providers = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Initialize Redis and PostgreSQL
    try {
      await redisClient.connect();
    } catch (err) {
      logger.warn({ err }, "Redis not available, continuing without cache");
    }

    try {
      await postgresClient.connect();
    } catch (err) {
      logger.warn({ err }, "PostgreSQL not available, continuing without DB");
    }

    // Initialize providers
    this.initializeProviders();
    this.initialized = true;
    
    logger.info({ providers: Array.from(this.providers.keys()) }, "AI Gateway initialized");
  }

  initializeProviders() {
    // OpenAI
    if (process.env.OPENAI_BSU_KEY || process.env.OPENAI_API_KEY) {
      const openaiKey = process.env.OPENAI_BSU_KEY || process.env.OPENAI_API_KEY;
      this.providers.set("openai", new AIProvider("openai", {
        client: new OpenAI({ apiKey: openaiKey }),
        models: ["gpt-4o-mini", "gpt-4o", "gpt-4"],
        priority: 1
      }));
    }

    // Anthropic Claude
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set("anthropic", new AIProvider("anthropic", {
        client: new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
        models: ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-sonnet-20240229"],
        priority: 2
      }));
    }

    // Google Gemini
    if (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) {
      const geminiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
      this.providers.set("google", new AIProvider("google", {
        client: new GoogleGenerativeAI(geminiKey),
        models: ["gemini-pro", "gemini-1.5-pro"],
        priority: 3
      }));
    }

    // Kimi (Moonshot AI) - Chinese AI provider
    if (process.env.KIMI_API_KEY) {
      this.providers.set("kimi", new AIProvider("kimi", {
        apiKey: process.env.KIMI_API_KEY,
        apiUrl: "https://api.moonshot.cn/v1/chat/completions",
        models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
        priority: 5
      }));
    }

    // Perplexity (for search-augmented responses)
    if (process.env.PERPLEXITY_KEY) {
      this.providers.set("perplexity", new AIProvider("perplexity", {
        apiKey: process.env.PERPLEXITY_KEY,
        apiUrl: "https://api.perplexity.ai/chat/completions",
        models: ["sonar", "sonar-pro"],
        priority: 4
      }));
    }
  }

  getAvailableProviders() {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.isAvailable())
      .sort((a, b) => a[1].config.priority - b[1].config.priority);
  }

  async getCachedResponse(cacheKey) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info({ cacheKey }, "Cache hit");
        return cached;
      }
    } catch (err) {
      logger.error({ err }, "Cache retrieval error");
    }
    return null;
  }

  async cacheResponse(cacheKey, response, ttl = 3600) {
    try {
      await redisClient.set(cacheKey, response, ttl);
    } catch (err) {
      logger.error({ err }, "Cache storage error");
    }
  }

  generateCacheKey(messages, model, temperature) {
    const content = JSON.stringify({ messages, model, temperature });
    return `ai_cache:${crypto.createHash("sha256").update(content).digest("hex")}`;
  }

  async transformRequest(provider, messages, options = {}) {
    const { temperature = 0.7, maxTokens = 1200, model } = options;

    switch (provider) {
      case "openai":
      case "kimi":
      case "perplexity":
        return {
          model: model || "gpt-4o-mini",
          messages,
          temperature,
          max_tokens: maxTokens
        };

      case "anthropic":
        // Claude uses different format
        const systemMessage = messages.find(m => m.role === "system");
        const userMessages = messages.filter(m => m.role !== "system");
        return {
          model: model || "claude-3-5-sonnet-20241022",
          system: systemMessage?.content || "",
          messages: userMessages,
          temperature,
          max_tokens: maxTokens
        };

      case "google":
        // Gemini uses different format
        const content = messages
          .filter(m => m.role !== "system")
          .map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
          }));
        return {
          model: model || "gemini-pro",
          contents: content,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens
          }
        };

      default:
        throw new AppError(`Unknown provider: ${provider}`, 500, "UNKNOWN_PROVIDER");
    }
  }

  async callProvider(providerName, messages, options = {}) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new AppError(`Provider not configured: ${providerName}`, 400, "PROVIDER_NOT_CONFIGURED");
    }

    if (!provider.isAvailable()) {
      throw new AppError(`Provider unavailable: ${providerName}`, 503, "PROVIDER_UNAVAILABLE");
    }

    const startTime = Date.now();
    
    try {
      let response;
      const requestData = await this.transformRequest(providerName, messages, options);

      switch (providerName) {
        case "openai":
          response = await this.callOpenAI(provider.config.client, requestData);
          break;

        case "anthropic":
          response = await this.callClaude(provider.config.client, requestData);
          break;

        case "google":
          response = await this.callGemini(provider.config.client, requestData);
          break;

        case "kimi":
          response = await this.callKimi(provider.config.apiKey, provider.config.apiUrl, requestData);
          break;

        case "perplexity":
          response = await this.callPerplexity(provider.config.apiKey, provider.config.apiUrl, requestData);
          break;

        default:
          throw new AppError(`Unsupported provider: ${providerName}`, 400, "UNSUPPORTED_PROVIDER");
      }

      provider.recordSuccess();
      
      const responseTime = Date.now() - startTime;
      return {
        ...response,
        provider: providerName,
        responseTime
      };

    } catch (err) {
      provider.recordFailure();
      logger.error({ provider: providerName, err: err.message }, "Provider call failed");
      throw err;
    }
  }

  async callOpenAI(client, requestData) {
    const response = await client.chat.completions.create(requestData);
    return {
      content: response.choices[0]?.message?.content || "",
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      },
      finishReason: response.choices[0]?.finish_reason
    };
  }

  async callClaude(client, requestData) {
    const response = await client.messages.create(requestData);
    return {
      content: response.content[0]?.text || "",
      model: response.model,
      usage: {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
      },
      finishReason: response.stop_reason
    };
  }

  async callGemini(client, requestData) {
    const model = client.getGenerativeModel({ model: requestData.model });
    const chat = model.startChat({
      generationConfig: requestData.generationConfig,
      history: requestData.contents.slice(0, -1)
    });
    
    const lastMessage = requestData.contents[requestData.contents.length - 1];
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    const response = result.response;
    
    return {
      content: response.text(),
      model: requestData.model,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      },
      finishReason: "stop"
    };
  }

  async callKimi(apiKey, apiUrl, requestData) {
    const response = await this.fetchWithTimeout(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new AppError(`Kimi API error: ${response.statusText}`, response.status, "KIMI_ERROR");
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || "",
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      finishReason: data.choices[0]?.finish_reason
    };
  }

  async callPerplexity(apiKey, apiUrl, requestData) {
    const response = await this.fetchWithTimeout(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...requestData,
        return_citations: true,
        return_images: false
      })
    });

    if (!response.ok) {
      throw new AppError(`Perplexity API error: ${response.statusText}`, response.status, "PERPLEXITY_ERROR");
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || "",
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      citations: data.citations || [],
      finishReason: data.choices[0]?.finish_reason
    };
  }

  async fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async executeWithFallback(messages, options = {}) {
    const { useCache = true, preferredProvider } = options;

    // Check cache first
    if (useCache) {
      const cacheKey = this.generateCacheKey(messages, options.model, options.temperature);
      const cached = await this.getCachedResponse(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }
    }

    // Get available providers sorted by priority
    let providers = this.getAvailableProviders();
    
    // If preferred provider specified, try it first
    if (preferredProvider) {
      const preferredIndex = providers.findIndex(([name]) => name === preferredProvider);
      if (preferredIndex > 0) {
        const [preferred] = providers.splice(preferredIndex, 1);
        providers.unshift(preferred);
      }
    }

    const errors = [];

    // Try each provider in order
    for (const [providerName, provider] of providers) {
      try {
        logger.info({ provider: providerName }, "Attempting provider");
        const response = await this.callProvider(providerName, messages, options);
        
        // Cache successful response
        if (useCache) {
          const cacheKey = this.generateCacheKey(messages, options.model, options.temperature);
          await this.cacheResponse(cacheKey, response);
        }
        
        return { ...response, fromCache: false };
      } catch (err) {
        errors.push({ provider: providerName, error: err.message });
        logger.warn({ provider: providerName, error: err.message }, "Provider failed, trying next");
        continue;
      }
    }

    // All providers failed
    throw new AppError(
      `All providers failed: ${errors.map(e => `${e.provider}: ${e.error}`).join("; ")}`,
      503,
      "ALL_PROVIDERS_FAILED"
    );
  }

  async logUsage(apiKeyId, requestId, provider, model, usage, responseTime, statusCode, error = null) {
    if (!postgresClient.isConnected) return;

    try {
      // Calculate cost
      const cost = await this.calculateCost(provider, model, usage.promptTokens, usage.completionTokens);

      await postgresClient.query(
        `INSERT INTO usage_logs 
        (api_key_id, request_id, provider, model, tokens_input, tokens_output, tokens_total, 
         cost_usd, response_time_ms, status_code, error_message)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          apiKeyId,
          requestId,
          provider,
          model,
          usage.promptTokens,
          usage.completionTokens,
          usage.totalTokens,
          cost,
          responseTime,
          statusCode,
          error
        ]
      );

      // Update daily usage
      await postgresClient.query(
        `INSERT INTO daily_usage (api_key_id, usage_date, request_count, tokens_total, cost_total_usd)
        VALUES ($1, CURRENT_DATE, 1, $2, $3)
        ON CONFLICT (api_key_id, usage_date) 
        DO UPDATE SET 
          request_count = daily_usage.request_count + 1,
          tokens_total = daily_usage.tokens_total + $2,
          cost_total_usd = daily_usage.cost_total_usd + $3`,
        [apiKeyId, usage.totalTokens, cost]
      );
    } catch (err) {
      logger.error({ err }, "Failed to log usage");
    }
  }

  async calculateCost(provider, model, inputTokens, outputTokens) {
    if (!postgresClient.isConnected) return 0;

    try {
      const result = await postgresClient.query(
        `SELECT input_cost_per_1m, output_cost_per_1m 
        FROM model_pricing 
        WHERE provider = $1 AND model = $2`,
        [provider, model]
      );

      if (result.rows.length === 0) return 0;

      const pricing = result.rows[0];
      const inputCost = (inputTokens / 1000000) * parseFloat(pricing.input_cost_per_1m);
      const outputCost = (outputTokens / 1000000) * parseFloat(pricing.output_cost_per_1m);
      
      return inputCost + outputCost;
    } catch (err) {
      logger.error({ err }, "Failed to calculate cost");
      return 0;
    }
  }

  selectOptimalModel(taskType, budget = "medium") {
    const taskModelMap = {
      "code_generation": {
        low: { provider: "openai", model: "gpt-4o-mini" },
        medium: { provider: "openai", model: "gpt-4o" },
        high: { provider: "anthropic", model: "claude-3-5-sonnet-20241022" }
      },
      "chat": {
        low: { provider: "openai", model: "gpt-4o-mini" },
        medium: { provider: "google", model: "gemini-pro" },
        high: { provider: "anthropic", model: "claude-3-5-sonnet-20241022" }
      },
      "analysis": {
        low: { provider: "google", model: "gemini-pro" },
        medium: { provider: "anthropic", model: "claude-3-sonnet-20240229" },
        high: { provider: "anthropic", model: "claude-3-opus-20240229" }
      },
      "search": {
        low: { provider: "perplexity", model: "sonar" },
        medium: { provider: "perplexity", model: "sonar-pro" },
        high: { provider: "perplexity", model: "sonar-pro" }
      }
    };

    return taskModelMap[taskType]?.[budget] || { provider: "openai", model: "gpt-4o-mini" };
  }
}

export const aiGateway = new UnifiedAIGateway();
