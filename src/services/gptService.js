import fetch from "node-fetch";
import { AppError } from "../utils/errors.js";
import { modelRouter } from "../config/modelRouter.js";
import { getCircuitBreaker } from "../utils/circuitBreaker.js";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const KIMI_API_URL = "https://api.moonshot.cn/v1/chat/completions";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

// Create circuit breakers per provider
const openaiCircuitBreaker = getCircuitBreaker('openai-api', {
  failureThreshold: 5,
  resetTimeout: 30000
});

const kimiCircuitBreaker = getCircuitBreaker('kimi-api', {
  failureThreshold: 5,
  resetTimeout: 30000
});

const anthropicCircuitBreaker = getCircuitBreaker('anthropic-api', {
  failureThreshold: 5,
  resetTimeout: 30000
});

export const runGPT = async ({ model, apiKey, system, user, messages, task, complexity, requiresSearch, searchQuery }) => {
  const shouldUseRouter = Boolean(requiresSearch || task || model?.includes("sonar") || model?.includes("perplexity"));

  if (shouldUseRouter) {
    const routed = await modelRouter.execute(
      { system, user, messages },
      {
        model,
        task: task || "chat_response",
        complexity: complexity || "medium",
        requiresSearch: Boolean(requiresSearch),
        searchQuery
      }
    );

    return routed?.output || "";
  }

  if (!apiKey) throw new AppError("Missing API key for model provider", 500, "MISSING_API_KEY");

  // Sanitize API key: remove any whitespace, newlines, or invisible characters
  const cleanKey = apiKey.replace(/[\s\r\n\t\u200B-\u200D\uFEFF]/g, '');

  // Wrap OpenAI API call in circuit breaker
  return openaiCircuitBreaker.execute(async () => {
    return callChatAPI(OPENAI_API_URL, cleanKey, {
      model: model || process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: messages || [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      max_tokens: 1200
    }, "OpenAI");
  });
};

/**
 * Run a chat completion using Kimi (Moonshot AI) - OpenAI-compatible API
 */
export const runKimi = async ({ apiKey, system, user, messages }) => {
  if (!apiKey) throw new AppError("Missing Kimi API key", 500, "MISSING_API_KEY");

  const cleanKey = apiKey.replace(/[\s\r\n\t\u200B-\u200D\uFEFF]/g, '');

  return kimiCircuitBreaker.execute(async () => {
    return callChatAPI(KIMI_API_URL, cleanKey, {
      model: process.env.KIMI_MODEL || "moonshot-v1-8k",
      messages: messages || [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      max_tokens: 1200
    }, "Kimi");
  });
};

/**
 * Run a chat completion using Anthropic Claude API
 */
export const runAnthropic = async ({ apiKey, system, user, messages }) => {
  if (!apiKey) throw new AppError("Missing Anthropic API key", 500, "MISSING_API_KEY");

  const cleanKey = apiKey.replace(/[\s\r\n\t\u200B-\u200D\uFEFF]/g, '');

  return anthropicCircuitBreaker.execute(async () => {
    return callAnthropicAPI(cleanKey, {
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
      system,
      max_tokens: 1200,
      messages: normalizeAnthropicMessages(messages, user)
    });
  });
};

/**
 * Unified chat function - tries providers in order of availability
 */
export const runChat = async ({ system, user, messages, providers }) => {
  const errors = [];

  for (const provider of providers) {
    try {
      if (provider.type === "openai" && provider.apiKey) {
        return await runGPT({ apiKey: provider.apiKey, system, user, messages });
      }
      if (provider.type === "kimi" && provider.apiKey) {
        return await runKimi({ apiKey: provider.apiKey, system, user, messages });
      }
      if (provider.type === "perplexity" && provider.apiKey) {
        const routed = await modelRouter.execute(
          { system, user, messages },
          { model: process.env.PERPLEXITY_MODEL || "llama-3.1-sonar-large-128k-online", task: "chat_response", requiresSearch: false }
        );
        return routed?.output || "";
      }
      if (provider.type === "anthropic" && provider.apiKey) {
        return await runAnthropic({ apiKey: provider.apiKey, system, user, messages });
      }
    } catch (err) {
      errors.push({ provider: provider.type, error: err.message });
    }
  }

  throw new AppError(
    `All AI providers failed: ${errors.map(e => `${e.provider}: ${e.error}`).join("; ")}`,
    503,
    "ALL_PROVIDERS_FAILED"
  );
};

/**
 * Generic OpenAI-compatible chat API caller
 */
async function callChatAPI(url, apiKey, payload, providerName) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();

      if (res.status === 401 || res.status === 403) {
        throw new AppError(`${providerName} API key is invalid or unauthorized`, 503, "INVALID_API_KEY");
      }

      if (res.status === 429) {
        throw new AppError(`${providerName} rate limit exceeded`, 429, "RATE_LIMITED");
      }

      throw new AppError(`${providerName} request failed: ${text}`, 502, "PROVIDER_ERROR");
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new AppError(`${providerName} request timeout`, 500, "PROVIDER_TIMEOUT");
    }
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.message?.includes('ENOTFOUND')) {
      throw new AppError(`Cannot connect to ${providerName} API - network or DNS issue`, 503, "NETWORK_ERROR");
    }
    throw err;
  }
}

function normalizeAnthropicMessages(messages, user) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [{ role: "user", content: String(user || "") }];
  }

  const normalized = [];

  for (const message of messages) {
    if (!message || typeof message !== "object") continue;
    if (message.role === "system") continue;

    if (message.role === "user" || message.role === "assistant") {
      normalized.push({ role: message.role, content: String(message.content || "") });
    }
  }

  if (normalized.length === 0) {
    return [{ role: "user", content: String(user || "") }];
  }

  return normalized;
}

async function callAnthropicAPI(apiKey, payload) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();

      if (res.status === 401 || res.status === 403) {
        throw new AppError("Anthropic API key is invalid or unauthorized", 503, "INVALID_API_KEY");
      }

      if (res.status === 429) {
        throw new AppError("Anthropic rate limit exceeded", 429, "RATE_LIMITED");
      }

      throw new AppError(`Anthropic request failed: ${text}`, 502, "PROVIDER_ERROR");
    }

    const data = await res.json();
    return data?.content?.map((part) => part?.text || "").join("").trim() || "";
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new AppError("Anthropic request timeout", 500, "PROVIDER_TIMEOUT");
    }
    if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED" || err.message?.includes("ENOTFOUND")) {
      throw new AppError("Cannot connect to Anthropic API - network or DNS issue", 503, "NETWORK_ERROR");
    }
    throw err;
  }
}
