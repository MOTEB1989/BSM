import { Router } from "express";
import { runAgent } from "../runners/agentRunner.js";
import { runGPT } from "../services/gptService.js";
import { models } from "../config/models.js";
import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

const router = Router();

// Unified key-status endpoint — single source of truth
router.get("/key-status", (_req, res, next) => {
  try {
    const status = {
      openai: Boolean(models.openai?.default || models.openai?.bsm || models.openai?.bsu),
      anthropic: Boolean(models.anthropic?.default),
      perplexity: Boolean(models.perplexity?.default),
      google: Boolean(models.google?.default),
      azure: Boolean(models.azure?.default),
      groq: Boolean(models.groq?.default),
      cohere: Boolean(models.cohere?.default),
      mistral: Boolean(models.mistral?.default)
    };

    const activeCount = Object.values(status).filter(Boolean).length;

    const ui = {
      openai: status.openai ? "✅ GPT-4 Ready" : "🔴 GPT-4 Offline",
      anthropic: status.anthropic ? "✅ Claude Ready" : "🔴 Claude Offline",
      perplexity: status.perplexity ? "✅ Perplexity Ready" : "🔴 Perplexity Offline",
      google: status.google ? "✅ Gemini Ready" : "🔴 Gemini Offline",
      azure: status.azure ? "✅ Azure OpenAI Ready" : "⚫ Azure Offline",
      groq: status.groq ? "✅ Groq Ready" : "⚫ Groq Offline",
      cohere: status.cohere ? "✅ Cohere Ready" : "⚫ Cohere Offline",
      mistral: status.mistral ? "✅ Mistral Ready" : "⚫ Mistral Offline"
    };

    res.json({
      configured: status.openai,
      activeProviders: activeCount,
      timestamp: new Date().toISOString(),
      status,
      ui
    });
  } catch (err) {
    next(err);
  }
});

// Agent-based chat
router.post("/", async (req, res, next) => {
  try {
    const { agentId, input } = req.body;
    const result = await runAgent({ agentId, input });
    res.json({ output: result.output });
  } catch (err) {
    next(err);
  }
});

// Direct GPT chat (no agent required)
router.post("/direct", async (req, res, next) => {
  try {
    const { message, history = [], language = "ar", model: requestedModel = "gpt-4o-mini" } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      throw new AppError("Message is required", 400, "INVALID_INPUT");
    }

    if (message.length > env.maxAgentInputLength) {
      throw new AppError("Message too long", 400, "INPUT_TOO_LONG");
    }

    if (!Array.isArray(history)) {
      throw new AppError("History must be an array", 400, "INVALID_HISTORY");
    }

    if (!["ar", "en"].includes(language)) {
      throw new AppError("Unsupported language", 400, "INVALID_LANGUAGE");
    }

    const ALLOWED_MODELS = ["gpt-4o-mini", "gpt-4o", "perplexity"];
    const selectedModel = ALLOWED_MODELS.includes(requestedModel) ? requestedModel : "gpt-4o-mini";

    const systemPrompt = language === "ar"
      ? "أنت مساعد ذكي من منصة LexBANK. أجب باللغة العربية بشكل مهني ومفيد. ساعد المستخدمين في الأسئلة القانونية والتقنية والإدارية."
      : "You are a smart assistant from the LexBANK platform. Answer professionally and helpfully. Assist users with legal, technical, and administrative questions.";

    let result;

    if (selectedModel === "perplexity") {
      if (!models.perplexity?.default) {
        throw new AppError("Perplexity service is not configured", 503, "MISSING_API_KEY");
      }
      const { modelRouter } = await import("../config/modelRouter.js");
      const routed = await modelRouter.execute(
        { system: systemPrompt, user: message, messages: null },
        { requiresSearch: true, searchQuery: message, task: "chat_response", complexity: "medium" }
      );
      result = routed?.output || "";
    } else {
      const apiKey = models.openai?.bsm || models.openai?.default;
      if (!apiKey) {
        throw new AppError("AI service is not configured", 503, "MISSING_API_KEY");
      }

      const messages = [{ role: "system", content: systemPrompt }];
      const recentHistory = history.slice(-20);
      for (const msg of recentHistory) {
        if (msg && typeof msg === "object" && (msg.role === "user" || msg.role === "assistant")) {
          messages.push({ role: msg.role, content: String(msg.content).slice(0, env.maxAgentInputLength) });
        }
      }
      messages.push({ role: "user", content: message });

      result = await runGPT({
        model: selectedModel,
        apiKey,
        system: systemPrompt,
        user: message,
        messages
      });
    }

    const output = (result !== null && result !== undefined && result !== "")
      ? result
      : (language === "ar" ? "لم يتم استلام رد." : "No response received.");

    res.json({ output, modelUsed: selectedModel });
  } catch (err) {
    next(err);
  }
});

export default router;
