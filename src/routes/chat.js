import { Router } from "express";
import { runChat } from "../services/gptService.js";
import { models } from "../config/models.js";
import { AppError } from "../utils/errors.js";
import logger from "../utils/logger.js";
import { hasUsableApiKey } from "../utils/apiKey.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateChatInput } from "../middleware/validateChatInput.js";
import {
  buildChatMessages,
  getSystemPrompt,
  getDestinationSystemPrompt,
  formatOutput
} from "../utils/messageFormatter.js";

const router = Router();

// AI key status for chat UI
router.get("/key-status", asyncHandler(async (_req, res) => {
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
}));

// Destination-aware chat (all chat modes including agent destinations)
// Accepts: { agentId, message, history, language }
// agentId selects a specialized system prompt (legal-agent, governance-agent, agent-auto, direct)
router.post("/", validateChatInput, asyncHandler(async (req, res) => {
  const { agentId, message, history = [], language = "ar" } = req.body;

  // Build provider list - when agentId is kimi-agent, prefer Kimi first
  const providers = [];
  const openaiKey = models.openai?.bsm || models.openai?.default;
  const kimiKey = models.kimi?.default;
  const perplexityKey = models.perplexity?.default;
  const anthropicKey = models.anthropic?.default;

  if (agentId === "kimi-agent" && hasUsableApiKey(kimiKey)) {
    providers.push({ type: "kimi", apiKey: kimiKey });
  }
  if (hasUsableApiKey(openaiKey)) providers.push({ type: "openai", apiKey: openaiKey });
  if (hasUsableApiKey(kimiKey) && agentId !== "kimi-agent") providers.push({ type: "kimi", apiKey: kimiKey });
  if (hasUsableApiKey(perplexityKey)) providers.push({ type: "perplexity", apiKey: perplexityKey });
  if (hasUsableApiKey(anthropicKey)) providers.push({ type: "anthropic", apiKey: anthropicKey });

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
