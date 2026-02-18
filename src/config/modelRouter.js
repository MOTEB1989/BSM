import fetch from "node-fetch";
import logger from "../utils/logger.js";
import { AppError } from "../utils/errors.js";
import { env } from "./env.js";
import { models } from "./models.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 45000;

export class MultiModelRouter {
  constructor() {
    this.capabilities = {
      "gpt-4": { reasoning: 10, speed: 6, cost: 10, search: false },
      "gpt-4o": { reasoning: 9, speed: 9, cost: 7, search: false },
      "gpt-4o-mini": { reasoning: 7, speed: 10, cost: 3, search: false },
      "claude-3-opus": { reasoning: 10, speed: 5, cost: 9, search: false },
      "claude-3-sonnet": { reasoning: 8, speed: 8, cost: 5, search: false },
      "gemini-pro": { reasoning: 7, speed: 7, cost: 3, search: true },
      "llama-3.1-70b-versatile": { reasoning: 8, speed: 10, cost: 2, search: false },
      [env.perplexityModel]: {
        reasoning: 8,
        speed: 8,
        cost: 6,
        search: true,
        citations: true
      }
    };
  }

  selectModel(task, complexity = "medium", requiresSearch = false) {
    if (requiresSearch || task === "legal_research" || task === "security_cve_lookup") {
      return env.perplexityModel;
    }

    const taskModels = {
      code_review: {
        critical: ["claude-3-opus", "gpt-4"],
        high: ["gpt-4o", "claude-3-sonnet"],
        medium: ["gemini-pro", "gpt-4o"]
      },
      security_scan: {
        critical: ["claude-3-opus", "gpt-4"],
        high: [env.perplexityModel, "gpt-4o"]
      },
      legal_analysis: {
        critical: [env.perplexityModel],
        high: ["claude-3-opus", "gpt-4"]
      },
      chat_response: {
        high: ["gpt-4o", "claude-3-sonnet"],
        medium: [env.defaultModel, "gemini-pro"],
        low: [env.defaultModel]
      }
    };

    const candidates = taskModels[task]?.[complexity] || [env.defaultModel];
    return candidates[0];
  }

  getProvider(model) {
    if (model?.includes("sonar") || model?.includes("perplexity")) return "perplexity";
    if (model?.startsWith("gpt-") || model?.startsWith("o1") || model?.startsWith("o3")) return "openai";
    if (model?.startsWith("claude-")) return "anthropic";
    if (model?.includes("gemini")) return "google";
    if (model?.includes("llama") || model?.includes("mixtral") || model?.includes("groq")) return "groq";
    if (model?.includes("mistral")) return "mistral";
    return "openai";
  }

  async execute(prompt, options = {}) {
    const {
      task = "chat_response",
      complexity = "medium",
      requiresSearch = false,
      searchQuery = null,
      temperature = 0.2,
      maxTokens = 1200,
      model: forcedModel,
      _skipFallback = false
    } = options;

    const model = forcedModel || this.selectModel(task, complexity, requiresSearch);

    try {
      logger.info({ model, task, requiresSearch }, "Executing with model router");

      const provider = this.getProvider(model);

      if (provider === "perplexity") {
        return await this.callPerplexity(model, prompt, searchQuery, { temperature, maxTokens });
      }

      if (provider === "anthropic" && models.anthropic?.default) {
        return await this.callAnthropic(model, prompt, { temperature, maxTokens });
      }

      if (provider === "groq" && models.groq?.default) {
        return await this.callGroq(model, prompt, { temperature, maxTokens });
      }

      if (provider !== "openai" && provider !== "anthropic" && provider !== "groq") {
        logger.warn({ provider, model }, "Provider SDK not configured; falling back to OpenAI-compatible model");
      }

      return await this.callOpenAI(model, prompt, { temperature, maxTokens });
    } catch (error) {
      if (_skipFallback || !env.fallbackEnabled) {
        throw error;
      }
      logger.error({ model, error: error.message }, "Model failed, trying fallback");
      return this.executeWithFallback(prompt, options, model);
    }
  }

  async callOpenAI(model, prompt, options) {
    const apiKey = models.openai?.bsm || models.openai?.default;
    if (!apiKey) {
      throw new AppError("Missing OpenAI API key", 500, "MISSING_API_KEY");
    }

    const response = await this.postChat(OPENAI_URL, apiKey, {
      model: model || process.env.OPENAI_MODEL || env.defaultModel,
      messages: this.buildMessages(prompt),
      temperature: options.temperature,
      max_tokens: options.maxTokens
    });

    return {
      output: response.choices?.[0]?.message?.content || "",
      citations: [],
      usage: response.usage,
      modelUsed: model,
      searchPerformed: false,
      timestamp: new Date().toISOString()
    };
  }

  async callPerplexity(model, prompt, searchQuery, options) {
    const apiKey = models.perplexity?.default;
    if (!apiKey) {
      throw new AppError("Missing Perplexity API key", 500, "MISSING_API_KEY");
    }

    const response = await this.postChat(PERPLEXITY_URL, apiKey, {
      model: model || env.perplexityModel,
      messages: [
        {
          role: "system",
          content: "أنت مساعد ذكي تبحث في الإنترنت وتقدم إجابات دقيقة مع مصادر. استخدم اللغة العربية إذا كان السؤال بالعربية."
        },
        {
          role: "user",
          content: searchQuery || this.extractUserPrompt(prompt)
        }
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      return_citations: env.perplexityCitations,
      return_images: false,
      return_related_questions: false
    });

    const choice = response.choices?.[0] || {};

    return {
      output: choice.message?.content || "",
      citations: choice.citations || response.citations || [],
      usage: response.usage,
      modelUsed: model,
      searchPerformed: true,
      timestamp: new Date().toISOString()
    };
  }

  async callAnthropic(model, prompt, options) {
    const apiKey = models.anthropic?.default;
    if (!apiKey) {
      throw new AppError("Missing Anthropic API key", 500, "MISSING_API_KEY");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model || "claude-3-sonnet-20240229",
          max_tokens: options.maxTokens || 1200,
          messages: this.buildMessages(prompt).filter(m => m.role !== "system"),
          system: this.buildMessages(prompt).find(m => m.role === "system")?.content || "You are a precise assistant."
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new AppError(`Anthropic request failed: ${errorText}`, 500, "MODEL_REQUEST_FAILED");
      }

      const data = await res.json();
      return {
        output: data.content?.[0]?.text || "",
        citations: [],
        usage: data.usage,
        modelUsed: model,
        searchPerformed: false,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      if (err.name === "AbortError") {
        throw new AppError("Anthropic request timeout", 500, "MODEL_TIMEOUT");
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async callGroq(model, prompt, options) {
    const apiKey = models.groq?.default;
    if (!apiKey) {
      throw new AppError("Missing Groq API key", 500, "MISSING_API_KEY");
    }

    const response = await this.postChat(GROQ_URL, apiKey, {
      model: model || "llama-3.1-70b-versatile",
      messages: this.buildMessages(prompt),
      temperature: options.temperature,
      max_tokens: options.maxTokens
    });

    return {
      output: response.choices?.[0]?.message?.content || "",
      citations: [],
      usage: response.usage,
      modelUsed: model,
      searchPerformed: false,
      timestamp: new Date().toISOString()
    };
  }

  async executeWithFallback(prompt, options, failedModel) {
    const fallbacks = {
      [env.perplexityModel]: ["gpt-4o", env.defaultModel],
      "claude-3-opus": ["gpt-4", env.perplexityModel],
      "claude-3-sonnet": ["gpt-4o", env.defaultModel],
      "gpt-4": ["gpt-4o", env.defaultModel],
      "gpt-4o": [env.defaultModel, "llama-3.1-70b-versatile"],
      "gpt-4o-mini": ["llama-3.1-70b-versatile"],
      "llama-3.1-70b-versatile": ["gpt-4o-mini", env.defaultModel]
    };

    const alternatives = fallbacks[failedModel] || [env.defaultModel];

    for (const model of alternatives) {
      try {
        return await this.execute(prompt, { ...options, model, _skipFallback: true });
      } catch {
        // Continue to next fallback
      }
    }

    throw new AppError("All model fallbacks failed", 500, "ALL_MODELS_FAILED");
  }

  async postChat(url, apiKey, payload) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new AppError(`Model request failed: ${errorText}`, 500, "MODEL_REQUEST_FAILED");
      }

      return await res.json();
    } catch (err) {
      if (err.name === "AbortError") {
        throw new AppError("Model request timeout", 500, "MODEL_TIMEOUT");
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  buildMessages(prompt) {
    if (Array.isArray(prompt?.messages) && prompt.messages.length > 0) {
      return prompt.messages;
    }

    return [
      {
        role: "system",
        content: prompt?.system || "You are a precise assistant."
      },
      {
        role: "user",
        content: this.extractUserPrompt(prompt)
      }
    ];
  }

  extractUserPrompt(prompt) {
    if (typeof prompt === "string") return prompt;
    if (prompt?.user) return String(prompt.user);
    return "";
  }
}

export const modelRouter = new MultiModelRouter();
