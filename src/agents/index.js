import { GeminiAgent } from "./gemini-agent.js";
import { PerplexityAgent } from "./perplexity-agent.js";
import { ClaudeAgent } from "./claude-agent.js";
import logger from "../utils/logger.js";

export function initializeAgents(config) {
  const agents = new Map();
  
  try {
    // تسجيل الوكلاء الجدد
    if (config.GEMINI_API_KEY) {
      agents.set("gemini-agent", new GeminiAgent(config.GEMINI_API_KEY));
      logger.info("✅ Gemini agent registered");
    } else {
      logger.warn("⚠️  GEMINI_API_KEY not found, skipping Gemini agent");
    }

    if (config.PERPLEXITY_API_KEY) {
      agents.set("perplexity-agent", new PerplexityAgent(config.PERPLEXITY_API_KEY));
      logger.info("✅ Perplexity agent registered");
    } else {
      logger.warn("⚠️  PERPLEXITY_API_KEY not found, skipping Perplexity agent");
    }

    if (config.ANTHROPIC_API_KEY) {
      agents.set("claude-agent", new ClaudeAgent(config.ANTHROPIC_API_KEY));
      logger.info("✅ Claude agent registered");
    } else {
      logger.warn("⚠️  ANTHROPIC_API_KEY not found, skipping Claude agent");
    }

  } catch (error) {
    logger.error("Error initializing agents:", error);
    throw error;
  }

  return {
    get: (name) => {
      const agent = agents.get(name);
      if (!agent) {
        throw new Error(`Agent ${name} not found`);
      }
      return agent;
    },
    list: () => Array.from(agents.keys()),
    getAll: () => agents,
    health: () => {
      const status = {};
      for (const [name, agent] of agents) {
        status[name] = agent.getStatus ? agent.getStatus() : { status: "unknown" };
      }
      return status;
    }
  };
}
