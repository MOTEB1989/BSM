import { Router } from "express";
import { runAgent } from "../runners/agentRunner.js";
import { runGPT } from "../services/gptService.js";
import { models } from "../config/models.js";
import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";

const router = Router();

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
    const { message, history = [], language = "ar" } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      throw new AppError("Message is required", 400, "INVALID_INPUT");
    }

    if (message.length > env.maxAgentInputLength) {
      throw new AppError("Message too long", 400, "INPUT_TOO_LONG");
    }

    const apiKey = models.openai?.bsm || models.openai?.default;
    if (!apiKey) {
      throw new AppError("API key not configured", 500, "MISSING_API_KEY");
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
      if (msg.role === "user" || msg.role === "assistant") {
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
