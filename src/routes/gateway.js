import { Router } from "express";
import { aiGateway } from "../services/aiGateway.js";
import { quotaManager } from "../services/quotaManager.js";
import { AppError } from "../utils/errors.js";
import logger from "../utils/logger.js";
import crypto from "crypto";

const router = Router();

// Middleware to validate API key and check quotas
const validateGatewayAccess = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"] || req.query.apiKey;
    
    if (!apiKey) {
      throw new AppError("API key required", 401, "API_KEY_REQUIRED");
    }

    // Validate API key
    const keyData = await quotaManager.validateApiKey(apiKey);
    req.apiKeyData = keyData;

    // Check rate limit
    const rateLimitCheck = await quotaManager.checkRateLimit(keyData.id);
    if (!rateLimitCheck.allowed) {
      res.setHeader("Retry-After", rateLimitCheck.retryAfter);
      throw new AppError(
        `Rate limit exceeded. Try again in ${rateLimitCheck.retryAfter} seconds`,
        429,
        "RATE_LIMIT_EXCEEDED"
      );
    }

    // Set rate limit headers
    if (rateLimitCheck.remainingPoints !== undefined) {
      res.setHeader("X-RateLimit-Remaining", rateLimitCheck.remainingPoints);
    }

    // Check quota
    const quotaCheck = await quotaManager.checkQuota(keyData.id);
    if (!quotaCheck.allowed) {
      throw new AppError(
        `Quota exceeded: ${quotaCheck.reason}. Used ${quotaCheck.used} of ${quotaCheck.quota}`,
        429,
        "QUOTA_EXCEEDED"
      );
    }

    // Set quota headers
    res.setHeader("X-Quota-Daily-Used", quotaCheck.dailyUsed || 0);
    res.setHeader("X-Quota-Daily-Limit", quotaCheck.dailyQuota || "unlimited");
    res.setHeader("X-Quota-Monthly-Used", quotaCheck.monthlyUsed || 0);
    res.setHeader("X-Quota-Monthly-Limit", quotaCheck.monthlyQuota || "unlimited");

    next();
  } catch (err) {
    next(err);
  }
};

// Initialize gateway on first request
router.use(async (req, res, next) => {
  if (!aiGateway.initialized) {
    await aiGateway.initialize();
  }
  next();
});

// Unified completion endpoint - OpenAI compatible
router.post("/completions", validateGatewayAccess, async (req, res, next) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const {
      messages,
      model,
      temperature = 0.7,
      max_tokens = 1200,
      provider,
      task_type = "chat",
      budget = "medium",
      use_cache = true
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new AppError("Messages array is required", 400, "INVALID_MESSAGES");
    }

    // Validate messages format
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        throw new AppError("Each message must have role and content", 400, "INVALID_MESSAGE_FORMAT");
      }
    }

    // Determine optimal model if not specified
    let targetProvider = provider;
    let targetModel = model;

    if (!provider || !model) {
      const optimal = aiGateway.selectOptimalModel(task_type, budget);
      targetProvider = targetProvider || optimal.provider;
      targetModel = targetModel || optimal.model;
    }

    // Execute with automatic fallback
    const response = await aiGateway.executeWithFallback(messages, {
      model: targetModel,
      temperature,
      maxTokens: max_tokens,
      preferredProvider: targetProvider,
      useCache: use_cache
    });

    const responseTime = Date.now() - startTime;

    // Log usage
    await aiGateway.logUsage(
      req.apiKeyData.id,
      requestId,
      response.provider,
      response.model,
      response.usage,
      responseTime,
      200
    );

    // Return OpenAI-compatible format
    res.json({
      id: requestId,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      provider: response.provider,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: response.content
          },
          finish_reason: response.finishReason || "stop"
        }
      ],
      usage: {
        prompt_tokens: response.usage.promptTokens,
        completion_tokens: response.usage.completionTokens,
        total_tokens: response.usage.totalTokens
      },
      citations: response.citations || [],
      from_cache: response.fromCache || false,
      response_time_ms: responseTime
    });

  } catch (err) {
    const responseTime = Date.now() - startTime;
    
    // Log failed request
    if (req.apiKeyData) {
      await aiGateway.logUsage(
        req.apiKeyData.id,
        requestId,
        "unknown",
        "unknown",
        { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        responseTime,
        err.statusCode || 500,
        err.message
      );
    }

    next(err);
  }
});

// Chat endpoint - simpler interface
router.post("/chat", validateGatewayAccess, async (req, res, next) => {
  try {
    const { message, history = [], provider, model, temperature = 0.7 } = req.body;

    if (!message || typeof message !== "string") {
      throw new AppError("Message is required", 400, "INVALID_MESSAGE");
    }

    // Build messages array
    const messages = [
      { role: "system", content: "You are a helpful AI assistant." }
    ];

    // Add history
    if (Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        if (msg.role && msg.content) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: "user", content: message });

    // Forward to completions endpoint
    req.body = {
      messages,
      model,
      provider,
      temperature,
      use_cache: true
    };

    // Call completions handler
    return router.handle(
      { ...req, method: "POST", url: "/gateway/completions" },
      res,
      next
    );

  } catch (err) {
    next(err);
  }
});

// Provider health check
router.get("/providers", async (req, res, next) => {
  try {
    const providers = aiGateway.getAvailableProviders();
    
    const providerStatus = providers.map(([name, provider]) => ({
      name,
      available: provider.isAvailable(),
      priority: provider.config.priority,
      models: provider.config.models || [],
      failures: provider.failureCount,
      lastFailure: provider.lastFailureTime
    }));

    res.json({
      timestamp: new Date().toISOString(),
      providers: providerStatus,
      total: providers.length
    });
  } catch (err) {
    next(err);
  }
});

// Cost estimation
router.post("/estimate-cost", async (req, res, next) => {
  try {
    const { provider, model, input_tokens, output_tokens } = req.body;

    if (!provider || !model) {
      throw new AppError("Provider and model are required", 400, "MISSING_PARAMS");
    }

    const cost = await aiGateway.calculateCost(
      provider,
      model,
      input_tokens || 0,
      output_tokens || 0
    );

    res.json({
      provider,
      model,
      input_tokens: input_tokens || 0,
      output_tokens: output_tokens || 0,
      estimated_cost_usd: cost,
      currency: "USD"
    });
  } catch (err) {
    next(err);
  }
});

export default router;
