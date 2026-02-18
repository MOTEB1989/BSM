import { Router } from "express";
import { runAgent } from "../runners/agentRunner.js";
import { runChat } from "../services/gptService.js";
import { models } from "../config/models.js";
import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";
import { hasUsableApiKey } from "../utils/apiKey.js";

const router = Router();

// AI key status for chat UI
router.get("/key-status", async (_req, res, next) => {
  try {
    const status = {
      openai: hasUsableApiKey(models.openai?.bsm || models.openai?.default),
      kimi: hasUsableApiKey(models.kimi?.default),
      perplexity: hasUsableApiKey(models.perplexity?.default),
      anthropic: hasUsableApiKey(models.anthropic?.default),
      google: false
    };

    const anyAvailable = status.openai || status.kimi || status.perplexity || status.anthropic;

    const ui = {
      openai: status.openai ? "✅ GPT-4 Ready" : "🔴 GPT-4 Offline",
      kimi: status.kimi ? "✅ Kimi Ready" : "🔴 Kimi Offline",
      perplexity: status.perplexity ? "✅ Perplexity Ready" : "🔴 Perplexity Offline",
      anthropic: status.anthropic ? "✅ Claude Ready" : "🔴 Claude Offline",
      google: status.google ? "✅ Gemini Ready" : "🔴 Gemini Offline",
      chat: anyAvailable ? "✅ Chat Available" : "🔴 Chat Offline"
    };

    res.json({
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
    const { agentId, input, payload } = req.body;
    const result = await runAgent({ agentId, input, payload });
    res.json({ output: result.output });
  } catch (err) {
    next(err);
  }
});
// Direct GPT chat (no agent required)
router.post("/direct", async (req, res, next) => {
  try {
    const { message, history = [], language = "ar" } = req.body;

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

    // Build provider list based on available keys (priority order)
    const providers = [];
    const openaiKey = models.openai?.bsm || models.openai?.default;
    const kimiKey = models.kimi?.default;
    const perplexityKey = models.perplexity?.default;
    const anthropicKey = models.anthropic?.default;

    if (hasUsableApiKey(openaiKey)) providers.push({ type: "openai", apiKey: openaiKey });
    if (hasUsableApiKey(kimiKey)) providers.push({ type: "kimi", apiKey: kimiKey });
    if (hasUsableApiKey(perplexityKey)) providers.push({ type: "perplexity", apiKey: perplexityKey });
    if (hasUsableApiKey(anthropicKey)) providers.push({ type: "anthropic", apiKey: anthropicKey });

    if (providers.length === 0) {
      throw new AppError("No AI service is configured", 503, "MISSING_API_KEY");
    }

    const systemPrompt = language === "ar"
      ? "أنت مساعد ذكي من منصة LexBANK. أجب باللغة العربية بشكل مهني ومفيد. ساعد المستخدمين في الأسئلة القانونية والتقنية والإدارية."
      : "You are a smart assistant from the LexBANK platform. Answer professionally and helpfully. Assist users with legal, technical, and administrative questions.";

    const chatMessages = [
      { role: "system", content: systemPrompt }
    ];

    // Add conversation history (limit to last 20 messages)
    const recentHistory = history.slice(-20);
    for (const msg of recentHistory) {
      if (
        msg &&
        typeof msg === "object" &&
        (msg.role === "user" || msg.role === "assistant")
      ) {
        chatMessages.push({ role: msg.role, content: String(msg.content).slice(0, env.maxAgentInputLength) });
      }
    }

    chatMessages.push({ role: "user", content: message });

    const result = await runChat({
      system: systemPrompt,
      user: message,
      messages: chatMessages,
      providers
    });

    const output = (result !== null && result !== undefined && result !== "")
      ? result
      : (language === "ar" ? "لم يتم استلام رد." : "No response received.");

    res.json({ output });
  } catch (err) {
    next(err);
  }
});

export default router;
