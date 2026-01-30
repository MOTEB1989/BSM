import { loadAgents } from "../services/agentsService.js";
import { loadKnowledgeIndex } from "../services/knowledgeService.js";
import { models } from "../config/models.js";
import { runGPT } from "../services/gptService.js";
import { AppError } from "../utils/errors.js";

export const runAgent = async ({ agentId, input }) => {
  const agents = await loadAgents();
  const agent = agents.find(a => a.id === agentId);
  if (!agent) throw new AppError(`Agent not found: ${agentId}`, 404, "AGENT_NOT_FOUND");

  const knowledge = await loadKnowledgeIndex();

  const provider = agent.modelProvider || "openai";
  const keyName = agent.modelKey || "bsm";
  const apiKey = models[provider]?.[keyName] || models[provider]?.default;

  const systemPrompt = `You are ${agent.name}. Role: ${agent.role}. Use the knowledge responsibly.`;
  const userPrompt = `Knowledge:\n${knowledge.join("\n")}\n\nUser Input:\n${input}`;

  const output = await runGPT({
    model: agent.modelName || process.env.OPENAI_MODEL,
    apiKey,
    system: systemPrompt,
    user: userPrompt
  });

  return {
    agent: { id: agent.id, name: agent.name },
    output
  };
};
