import { loadAgents } from "../services/agentsService.js";
import { loadKnowledgeIndex } from "../services/knowledgeService.js";
import { models } from "../config/models.js";
import { runGPT } from "../services/gptService.js";
import { AppError } from "../utils/errors.js";
import { createFile } from "../actions/githubActions.js";
import { extractIntent, intentToAction } from "../utils/intent.js";
import logger from "../utils/logger.js";

export const runAgent = async ({ agentId, input }) => {
  try {
    const agents = await loadAgents();
    const agent = agents.find(a => a.id === agentId);
    if (!agent) throw new AppError(`Agent not found: ${agentId}`, 404, "AGENT_NOT_FOUND");

    const knowledge = await loadKnowledgeIndex();

    const provider = agent.modelProvider || "openai";
    const keyName = agent.modelKey || "bsm";
    const apiKey = models[provider]?.[keyName] || models[provider]?.default;

    const systemPrompt = `You are ${agent.name}. Role: ${agent.role}. Use the knowledge responsibly.`;
    const userPrompt = `Knowledge:\n${knowledge.join("\n")}\n\nUser Input:\n${input}`;

    const result = await runGPT({
      model: agent.modelName || process.env.OPENAI_MODEL,
      apiKey,
      system: systemPrompt,
      user: userPrompt
    });

    const intent = extractIntent(result);
    const action = intentToAction(intent);
    if (action) {
      const allowedActions = new Set(agent.actions || []);
      if (!allowedActions.has(action)) {
        throw new AppError(`Action not permitted: ${action}`, 403, "ACTION_NOT_ALLOWED");
      }
    }

    if (intent === "create_agent") {
      await createFile(
        "data/agents/new-agent.yaml",
        "id: new-agent\nname: New Agent\nrole: Auto-created\n"
      );
    }

    if (intent === "update_file") {
      throw new AppError("Update file intent not implemented", 501, "UPDATE_FILE_NOT_IMPLEMENTED");
    }

    // Ensure output is always a string
    const output =
      (result !== null && result !== undefined && result !== "") ? result : "لم يصل رد من الوكيل.";

    return { output };
  } catch (err) {
    logger.error({ err, agentId }, "Agent execution failed");
    return { output: "حدث خطأ أثناء تشغيل الوكيل." };
  }
};
