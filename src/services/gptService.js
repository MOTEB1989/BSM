import { AppError } from "../utils/errors.js";
import { postJson, sanitizeApiKey } from "../utils/httpClient.js";
import { modelRouter } from "../config/modelRouter.js";
import { getCircuitBreaker } from "../utils/circuitBreaker.js";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const KIMI_API_URL = "https://api.moonshot.cn/v1/chat/completions";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 30000;

const openaiCircuitBreaker = getCircuitBreaker("openai-api", {
  failureThreshold: 5,
  resetTimeout: 30000
});

const kimiCircuitBreaker = getCircuitBreaker("kimi-api", {
  failureThreshold: 5,
  resetTimeout: 30000
});

const anthropicCircuitBreaker = getCircuitBreaker("anthropic-api", {
  failureThreshold: 5,
  resetTimeout: 30000
});

const geminiCircuitBreaker = getCircuitBreaker("gemini-api", {
  failureThreshold: 5,
  resetTimeout: 30000
});

const groqCircuitBreaker = getCircuitBreaker("groq-api", {
  failureThreshold: 5,
  resetTimeout: 30000
});

export const runGPT = async ({
  model,
  apiKey,
  system,
  user,
  messages,
  task,
  complexity,
  requiresSearch,
  searchQuery
}) => {
  const shouldUseRouter = Boolean(
    requiresSearch || task || model?.includes("sonar") || model?.includes("perplexity")
  );

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

  const cleanKey = sanitizeApiKey(apiKey);

  return openaiCircuitBreaker.execute(async () => {
    const data = await postJson(OPENAI_API_URL, {
      authHeader: `Bearer ${cleanKey}`,
      body: {
        model: model || process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages:
          messages ||
          [
            { role: "system", content: system },
            { role: "user", content: user }
          ],
        max_tokens: 1200
      },
      timeoutMs: REQUEST_TIMEOUT_MS,
      providerName: "OpenAI"
    });
    return data.choices?.[0]?.message?.content ?? "";
  });
};

export const runKimi = async ({ apiKey, system, user, messages }) => {
  if (!apiKey) throw new AppError("Missing Kimi API key", 500, "MISSING_API_KEY");

  const cleanKey = sanitizeApiKey(apiKey);

  return kimiCircuitBreaker.execute(async () => {
    const data = await postJson(KIMI_API_URL, {
      authHeader: `Bearer ${cleanKey}`,
      body: {
        model: process.env.KIMI_MODEL || "moonshot-v1-8k",
        messages:
          messages ||
          [
            { role: "system", content: system },
            { role: "user", content: user }
          ],
        max_tokens: 1200
      },
      timeoutMs: REQUEST_TIMEOUT_MS,
      providerName: "Kimi"
    });
    return data.choices?.[0]?.message?.content ?? "";
  });
};

export const runAnthropic = async ({ apiKey, system, user, messages }) => {
  if (!apiKey) throw new AppError("Missing Anthropic API key", 500, "MISSING_API_KEY");

  const cleanKey = sanitizeApiKey(apiKey);

  return anthropicCircuitBreaker.execute(async () => {
    const data = await postJson(ANTHROPIC_API_URL, {
      headers: {
        "x-api-key": cleanKey,
        "anthropic-version": "2023-06-01"
      },
      body: {
        model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
        system,
        max_tokens: 1200,
        messages: normalizeAnthropicMessages(messages, user)
      },
      timeoutMs: REQUEST_TIMEOUT_MS,
      providerName: "Anthropic"
    });
    return data?.content?.map((part) => part?.text || "").join("").trim() || "";
  });
};

export const runGemini = async ({ apiKey, system, user, messages }) => {
  if (!apiKey) throw new AppError("Missing Gemini API key", 500, "MISSING_API_KEY");

  const cleanKey = sanitizeApiKey(apiKey);
  const contents = buildGeminiContents(messages, user);

  return geminiCircuitBreaker.execute(async () => {
    const data = await postJson(GEMINI_API_URL, {
      headers: { "x-goog-api-key": cleanKey },
      body: {
        systemInstruction: { parts: [{ text: system || "" }] },
        contents,
        generationConfig: {
          maxOutputTokens: 1200,
          temperature: 0.2
        }
      },
      timeoutMs: REQUEST_TIMEOUT_MS,
      providerName: "Gemini"
    });
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || "";
  });
};

function buildGeminiContents(messages, user) {
  const parts = [];
  if (Array.isArray(messages)) {
    for (const m of messages) {
      if (!m || m.role === "system") continue;
      const role = m.role === "assistant" ? "model" : "user";
      const text = String(m.content || "").trim();
      if (text) parts.push({ role, parts: [{ text }] });
    }
  }
  if (typeof user === "string" && user.trim()) {
    parts.push({ role: "user", parts: [{ text: user.trim() }] });
  }
  if (parts.length === 0) {
    parts.push({ role: "user", parts: [{ text: "Hello" }] });
  }
  return parts;
}

export const runGroq = async ({ apiKey, system, user, messages }) => {
  if (!apiKey) throw new AppError("Missing Groq API key", 500, "MISSING_API_KEY");

  const cleanKey = sanitizeApiKey(apiKey);

  return groqCircuitBreaker.execute(async () => {
    const data = await postJson(GROQ_API_URL, {
      authHeader: `Bearer ${cleanKey}`,
      body: {
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        messages:
          messages ||
          [
            { role: "system", content: system },
            { role: "user", content: user }
          ],
        max_tokens: 1200
      },
      timeoutMs: REQUEST_TIMEOUT_MS,
      providerName: "Groq"
    });
    return data.choices?.[0]?.message?.content ?? "";
  });
};

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
          {
            model: process.env.PERPLEXITY_MODEL || "llama-3.1-sonar-large-128k-online",
            task: "chat_response",
            requiresSearch: false
          }
        );
        return routed?.output || "";
      }
      if (provider.type === "anthropic" && provider.apiKey) {
        return await runAnthropic({ apiKey: provider.apiKey, system, user, messages });
      }
      if (provider.type === "gemini" && provider.apiKey) {
        return await runGemini({ apiKey: provider.apiKey, system, user, messages });
      }
      if (provider.type === "groq" && provider.apiKey) {
        return await runGroq({ apiKey: provider.apiKey, system, user, messages });
      }
    } catch (err) {
      errors.push({ provider: provider.type, error: err.message });
    }
  }

  throw new AppError(
    `All AI providers failed: ${errors.map((e) => `${e.provider}: ${e.error}`).join("; ")}`,
    503,
    "ALL_PROVIDERS_FAILED"
  );
};

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
