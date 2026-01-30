import { loadAgents } from "../services/agentsService.js";
import { runAgent } from "../runners/agentRunner.js";

export const listAgents = async (req, res, next) => {
  try {
    const agents = await loadAgents();
    res.json({ agents, correlationId: req.correlationId });
  } catch (e) {
    next(e);
  }
};

export const executeAgent = async (req, res, next) => {
  try {
    const { agentId, input } = req.body;
    const result = await runAgent({ agentId, input });
    res.json({ result, correlationId: req.correlationId });
  } catch (e) {
    next(e);
  }
};
