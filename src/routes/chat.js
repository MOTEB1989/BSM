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
      google: hasUsableApiKey(models.google?.default)
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

/**
 * @route   POST /api/chat/gemini
 * @desc    الدردشة مع وكيل Gemini
 */
router.post("/gemini", async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) {
      throw new AppError("Message is required", 400, "INVALID_INPUT");
    }

    const agents = req.app.locals.agents;
    if (!agents) {
      throw new AppError("Agents not initialized", 503, "AGENTS_NOT_INITIALIZED");
    }

    try {
      const agent = agents.get("gemini-agent");
      const result = await agent.process(message, { history });
      res.json(result);
    } catch (error) {
      if (error.message.includes("not found")) {
        throw new AppError("Gemini agent is not available. GEMINI_API_KEY is not configured.", 503, "AGENT_NOT_AVAILABLE");
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/chat/perplexity
 * @desc    البحث باستخدام Perplexity
 */
router.post("/perplexity", async (req, res, next) => {
  try {
    const { message, model = "balanced" } = req.body;
    if (!message) {
      throw new AppError("Message is required", 400, "INVALID_INPUT");
    }

    const agents = req.app.locals.agents;
    if (!agents) {
      throw new AppError("Agents not initialized", 503, "AGENTS_NOT_INITIALIZED");
    }

    try {
      const agent = agents.get("perplexity-agent");
      const result = await agent.process(message, { model });
      res.json(result);
    } catch (error) {
      if (error.message.includes("not found")) {
        throw new AppError("Perplexity agent is not available. PERPLEXITY_API_KEY is not configured.", 503, "AGENT_NOT_AVAILABLE");
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/chat/claude
 * @desc    الدردشة مع وكيل Claude
 */
router.post("/claude", async (req, res, next) => {
  try {
    const { message, history = [], temperature = 0.7 } = req.body;
    if (!message) {
      throw new AppError("Message is required", 400, "INVALID_INPUT");
    }

    const agents = req.app.locals.agents;
    if (!agents) {
      throw new AppError("Agents not initialized", 503, "AGENTS_NOT_INITIALIZED");
    }

    try {
      const agent = agents.get("claude-agent");
      const result = await agent.process(message, { history, temperature });
      res.json(result);
    } catch (error) {
      if (error.message.includes("not found")) {
        throw new AppError("Claude agent is not available. ANTHROPIC_API_KEY is not configured.", 503, "AGENT_NOT_AVAILABLE");
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/chat/agents-status
 * @desc    حالة جميع وكلاء الدردشة AI
 */
router.get("/agents-status", (req, res) => {
  try {
    const agents = req.app.locals.agents;
    if (!agents) {
      return res.json({
        available: false,
        message: "AI agents not initialized",
        agents: {}
      });
    }
    
    res.json({
      available: true,
      agents: agents.health(),
      list: agents.list(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      available: false,
      error: error.message
    });
  }
});

export default router;
