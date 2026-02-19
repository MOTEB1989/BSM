import { Router } from "express";
import { runGPT } from "../services/gptService.js";
import { models } from "../config/models.js";
import { AppError } from "../utils/errors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateChatInput } from "../middleware/validateChatInput.js";
import { buildChatMessages, getSystemPrompt, formatOutput } from "../utils/messageFormatter.js";

const router = Router();

/**
 * AI Proxy endpoint for GPT-4 direct access
 * POST /api/ai-proxy
 * 
 * This endpoint provides direct access to GPT-4 without using agents.
 * It's designed for simple chat interfaces that need quick AI responses.
 */
router.post("/", validateChatInput, asyncHandler(async (req, res) => {
  const { message, history = [], language = "ar" } = req.body;

  // Check API key availability
  const apiKey = models.openai?.bsm || models.openai?.default;
  if (!apiKey) {
    throw new AppError("AI service is not configured", 503, "MISSING_API_KEY");
  }

  // Prepare system prompt and messages
  const systemPrompt = getSystemPrompt(language, "BSM");
  const messages = buildChatMessages(systemPrompt, history, message);

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
  const output = formatOutput(result, language);

  res.json({ 
    output,
    model: modelName,
    timestamp: new Date().toISOString()
  });
}));

/**
 * Health check endpoint for AI proxy
 * GET /api/ai-proxy/status
 */
router.get("/status", asyncHandler(async (_req, res) => {
  const hasKey = Boolean(models.openai?.bsm || models.openai?.default);
  const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  
  res.json({
    status: hasKey ? "active" : "inactive",
    service: modelName,
    timestamp: new Date().toISOString()
  });
}));

export default router;
