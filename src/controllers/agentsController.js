import { loadAgents } from "../services/agentsService.js";
import { runAgent } from "../runners/agentRunner.js";
import { env } from "../config/env.js";

export const listAgents = async (req, res, next) => {
  try {
    const agents = await loadAgents();
    res.json({ agents, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
};

export const executeAgent = async (req, res, next) => {
  try {
    const { agentId, input } = req.body;
    
    if (!agentId || typeof agentId !== "string") {
      return res.status(400).json({ 
        error: "Invalid or missing agentId", 
        correlationId: req.correlationId 
      });
    }
    
    if (!input || typeof input !== "string") {
      return res.status(400).json({ 
        error: "Invalid or missing input", 
        correlationId: req.correlationId 
      });
    }

    if (input.length > env.maxAgentInputLength) {
      return res.status(400).json({
        error: `Input exceeds maximum length of ${env.maxAgentInputLength} characters`,
        correlationId: req.correlationId
      });
    }
    
    const result = await runAgent({ agentId, input });
    res.json({ result, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
};
