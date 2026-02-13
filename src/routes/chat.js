import { Router } from "express";
import { runAgent } from "../runners/agentRunner.js";
import { runGPT } from "../services/gptService.js";
import { models } from "../config/models.js";
import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

const router = Router();

// AI key status for chat UI
router.get("/key-status", async (_req, res, next) => {
  try {
    const status = {
      openai: Boolean(models.openai?.bsm || models.openai?.default),
      anthropic: false,
      perplexity: Boolean(models.perplexity?.default),
      google: false
    };

    const ui = {
      openai: status.openai ? "✅ GPT-4 Ready" : "🔴 GPT-4 Offline",
      anthropic: status.anthropic ? "✅ Claude Ready" : "🔴 Claude Offline",
      perplexity: status.perplexity ? "✅ Perplexity Ready" : "🔴 Perplexity Offline",
      google: status.google ? "✅ Gemini Ready" : "🔴 Gemini Offline"
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

    const apiKey = models.openai?.bsm || models.openai?.default;
    if (!apiKey) {
      throw new AppError("AI service is not configured", 503, "MISSING_API_KEY");
    }

    const systemPrompt = language === "ar"
      ? "أنت مساعد ذكي من منصة LexBANK. أجب باللغة العربية بشكل مهني ومفيد. ساعد المستخدمين في الأسئلة القانونية والتقنية والإدارية."
      : "You are a smart assistant from the LexBANK platform. Answer professionally and helpfully. Assist users with legal, technical, and administrative questions.";

    const messages = [
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
        messages.push({ role: msg.role, content: String(msg.content).slice(0, env.maxAgentInputLength) });
      }
    }

    messages.push({ role: "user", content: message });

    const result = await runGPT({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      apiKey,
      system: systemPrompt,
      user: message,
      messages
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
