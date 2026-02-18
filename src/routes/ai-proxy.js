import { Router } from "express";
import { runGPT } from "../services/gptService.js";
import { models } from "../config/models.js";
import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";

const router = Router();

/**
 * AI Proxy endpoint for GPT-4 direct access
 * POST /api/ai-proxy
 * 
 * This endpoint provides direct access to GPT-4 without using agents.
 * It's designed for simple chat interfaces that need quick AI responses.
 */
router.post("/", async (req, res, next) => {
  try {
    const { message, history = [], language = "ar" } = req.body;

    // Input validation
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

    // Check API key availability
    const apiKey = models.openai?.bsm || models.openai?.default;
    if (!apiKey) {
      throw new AppError("AI service is not configured", 503, "MISSING_API_KEY");
    }

    // Prepare system prompt based on language
    const systemPrompt = language === "ar"
      ? "أنت مساعد ذكي متطور من منصة BSM. أجب باللغة العربية بشكل احترافي ومفيد. ساعد المستخدمين في الأسئلة القانونية والتقنية والإدارية بكفاءة عالية."
      : "You are an advanced AI assistant from BSM platform. Answer professionally and helpfully in English. Assist users with legal, technical, and administrative questions efficiently.";

    // Build messages array
    const messages = [
      { role: "system", content: systemPrompt }
    ];

    // Add conversation history (limit to last 20 messages for performance)
    const recentHistory = history.slice(-20);
    for (const msg of recentHistory) {
      if (
        msg &&
        typeof msg === "object" &&
        (msg.role === "user" || msg.role === "assistant")
      ) {
        messages.push({
          role: msg.role,
          content: String(msg.content).slice(0, env.maxAgentInputLength)
        });
      }
    }

    // Add current user message
    messages.push({ role: "user", content: message });

    // Get model once to avoid inconsistencies
    const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";

    // Call GPT service
    const result = await runGPT({
      model: modelName,
      apiKey,
      system: systemPrompt,
      user: message,
      messages
    });

    // Prepare output with fallback
    const output = (result !== null && result !== undefined && result !== "")
      ? result
      : (language === "ar" ? "لم يتم استلام رد." : "No response received.");

    res.json({ 
      output,
      model: modelName,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    next(err);
  }
});

/**
 * Health check endpoint for AI proxy
 * GET /api/ai-proxy/status
 */
router.get("/status", async (_req, res) => {
  try {
    const hasKey = Boolean(models.openai?.bsm || models.openai?.default);
    const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    
    res.json({
      status: hasKey ? "active" : "inactive",
      service: modelName,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
});

export default router;
