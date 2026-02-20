import { Router } from "express";
import { runChat } from "../services/gptService.js";
import { models } from "../config/models.js";
import { AppError } from "../utils/errors.js";
import logger from "../utils/logger.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildChatProviders } from "../utils/providerUtils.js";
import { validateChatInput } from "../middleware/validateChatInput.js";
import {
  buildChatMessages,
  getSystemPrompt,
  getDestinationSystemPrompt,
  formatOutput
} from "../utils/messageFormatter.js";

const router = Router();

// AI key status for chat UI - reflects actual enabled models from buildChatProviders
router.get("/key-status", asyncHandler(async (_req, res) => {
  const providers = buildChatProviders(models);
  const status = {
    openai: providers.some((p) => p.type === "openai"),
    kimi: providers.some((p) => p.type === "kimi"),
    perplexity: providers.some((p) => p.type === "perplexity"),
    anthropic: providers.some((p) => p.type === "anthropic"),
    google: providers.some((p) => p.type === "gemini"),
    groq: providers.some((p) => p.type === "groq")
  };
  const anyAvailable = providers.length > 0;

  const ui = {
    openai: status.openai ? "✅ GPT-4 Ready" : "🔴 GPT-4 Offline",
    kimi: status.kimi ? "✅ Kimi Ready" : "🔴 Kimi Offline",
    perplexity: status.perplexity ? "✅ Perplexity Ready" : "🔴 Perplexity Offline",
    anthropic: status.anthropic ? "✅ Claude Ready" : "🔴 Claude Offline",
    google: status.google ? "✅ Gemini Ready" : "🔴 Gemini Offline",
    groq: status.groq ? "✅ Groq Ready" : "🔴 Groq Offline",
    chat: anyAvailable ? "✅ Chat Available" : "🔴 Chat Offline"
  };

  res.json({
    timestamp: new Date().toISOString(),
    status,
    ui
  });
}));

// Destination-aware chat (all chat modes including agent destinations)
// Accepts: { agentId, message, history, language }
// agentId selects a specialized system prompt (legal-agent, governance-agent, agent-auto, direct)
router.post("/", validateChatInput, asyncHandler(async (req, res) => {
  const { agentId, message, history = [], language = "ar" } = req.body;

  const providers = buildChatProviders(models);
  if (providers.length === 0) {
    throw new AppError("No AI service is configured", 503, "MISSING_API_KEY");
  }

  // Use destination-specific system prompt when agentId is provided
  const systemPrompt = agentId && agentId !== "direct"
    ? getDestinationSystemPrompt(language, agentId)
    : getSystemPrompt(language, "LexBANK");

  logger.info({ agentId, language, historyLength: history.length }, "Destination chat request");

  const chatMessages = buildChatMessages(systemPrompt, history, message);

  const result = await runChat({
    system: systemPrompt,
    user: message,
    messages: chatMessages,
    providers
  });

  const output = formatOutput(result, language);

  res.json({ output });
}));

// Direct GPT chat (no agent required) - kept for backward compatibility
router.post("/direct", validateChatInput, asyncHandler(async (req, res) => {
  const { message, history = [], language = "ar" } = req.body;

  const providers = buildChatProviders(models);
  if (providers.length === 0) {
    throw new AppError("No AI service is configured", 503, "MISSING_API_KEY");
  }

  const systemPrompt = getSystemPrompt(language, "LexBANK");
  const chatMessages = buildChatMessages(systemPrompt, history, message);

  const result = await runChat({
    system: systemPrompt,
    user: message,
    messages: chatMessages,
    providers
  });

  const output = formatOutput(result, language);

  res.json({ output });
}));

export default router;
