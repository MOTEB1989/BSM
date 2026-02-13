import fetch from "node-fetch";
import { AppError } from "../utils/errors.js";
import { modelRouter } from "../config/modelRouter.js";
import { getCircuitBreaker } from "../utils/circuitBreaker.js";

const API_URL = "https://api.openai.com/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

// Create circuit breaker for OpenAI API
const openaiCircuitBreaker = getCircuitBreaker('openai-api', {
  failureThreshold: 5,
  resetTimeout: 30000 // 30 seconds
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

  // Wrap OpenAI API call in circuit breaker
  return openaiCircuitBreaker.execute(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    // Use full messages array if provided, otherwise build from system+user
    const chatMessages = messages || [
      { role: "system", content: system },
      { role: "user", content: user }
    ];

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model || process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: chatMessages,
          max_tokens: 1200
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text();
        throw new AppError(`GPT request failed: ${text}`, 500, "GPT_ERROR");
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new AppError("GPT request timeout", 500, "GPT_TIMEOUT");
      }
      throw err;
    }
  });
};
