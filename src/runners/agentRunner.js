import { loadAgents } from "../services/agentsService.js";
import { loadKnowledgeIndex } from "../services/knowledgeService.js";
import { models } from "../config/models.js";
import { runChat } from "../services/gptService.js";
import { AppError } from "../utils/errors.js";
import { createFile } from "../actions/githubActions.js";
import { extractIntent, intentToAction } from "../utils/intent.js";
import { parseCommandBlocks, executeCommands } from "../utils/commandExecutor.js";
import logger from "../utils/logger.js";
import { hasUsableApiKey } from "../utils/apiKey.js";

const resolveTemplateValue = (context, keyPath) => {
  return keyPath
    .split(".")
    .reduce((value, key) => (value && typeof value === "object" ? value[key] : undefined), context);
};

const renderPromptTemplate = (template, context) => {
  if (typeof template !== "string") return "";

  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, keyPath) => {
    const value = resolveTemplateValue(context, keyPath);
    return value === undefined || value === null ? "" : String(value);
  });
};

const providerCandidates = ["openai", "kimi", "perplexity", "anthropic"];

const resolveProviderKey = (provider, keyName) => {
  const selectedKey = models[provider]?.[keyName];
  if (hasUsableApiKey(selectedKey)) return selectedKey;

  const fallbackKey = models[provider]?.default;
  return hasUsableApiKey(fallbackKey) ? fallbackKey : null;
};

export const buildAgentProviders = (agent) => {
  const providers = [];
  const seen = new Set();

  const preferredProvider = agent.modelProvider || "openai";
  const preferredKeyName = agent.modelKey || "default";

  const preferredKey = resolveProviderKey(preferredProvider, preferredKeyName);
  if (preferredKey) {
    providers.push({ type: preferredProvider, apiKey: preferredKey });
    seen.add(preferredProvider);
  }

  for (const provider of providerCandidates) {
    if (seen.has(provider)) continue;

    const apiKey = resolveProviderKey(provider, "default");
    if (apiKey) {
      providers.push({ type: provider, apiKey });
      seen.add(provider);
    }
  }

  return providers;
};

export const runAgent = async ({ agentId, input, payload = {} }) => {
  try {
    const agents = await loadAgents();
    const agent = agents.find(a => a.id === agentId);
    if (!agent) throw new AppError(`Agent not found: ${agentId}`, 404, "AGENT_NOT_FOUND");

    const knowledge = await loadKnowledgeIndex();

    const providers = buildAgentProviders(agent);

    if (providers.length === 0) {
      throw new AppError("No AI service is configured", 503, "MISSING_API_KEY");
    }

    const defaultSystemPrompt = `You are ${agent.name}. Role: ${agent.role}. Use the knowledge responsibly.`;
    const defaultUserPrompt = `Knowledge:\n${knowledge.join("\n")}\n\nUser Input:\n${input}`;

    const promptContext = {
      input,
      knowledge: knowledge.join("\n"),
      payload,
      agentName: agent.name,
      agentRole: agent.role,
      ...payload
    };

    const systemPrompt = agent.systemPrompt
      ? renderPromptTemplate(agent.systemPrompt, promptContext)
      : defaultSystemPrompt;

    const userPrompt = agent.userPrompt
      ? renderPromptTemplate(agent.userPrompt, promptContext)
      : defaultUserPrompt;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const result = await runChat({
      model: agent.modelName || process.env.OPENAI_MODEL,
      system: systemPrompt,
      user: userPrompt,
      messages,
      providers
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

    // Auto-execute terminal commands if present in the response
    if (intent === "execute_command") {
      const commands = parseCommandBlocks(result);
      if (commands.length > 0) {
        logger.info({ agentId, commandCount: commands.length }, "Auto-executing terminal commands");
        const commandResults = executeCommands(commands);

        // Build enriched output with command results
        let enrichedOutput = result;

        // Replace command blocks with their execution results
        for (let i = 0; i < commands.length; i++) {
          const cmdResult = commandResults[i];
          const statusIcon = cmdResult.success ? "✅" : "❌";
          const resultBlock = [
            `\n---`,
            `${statusIcon} **\`${cmdResult.command}\`** (${cmdResult.duration}ms)`,
            "```",
            cmdResult.output,
            "```"
          ].join("\n");

          enrichedOutput = enrichedOutput.replace(
            `[EXECUTE_COMMAND]${commands[i]}[/EXECUTE_COMMAND]`,
            resultBlock
          );
        }

        return { output: enrichedOutput, commandResults };
      }
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
