import EventEmitter from "events";
import { loadAgents } from "../services/agentsService.js";
import { loadKnowledgeIndex } from "../services/knowledgeService.js";
import { models } from "../config/models.js";
import { runGPT } from "../services/gptService.js";
import { AppError } from "../utils/errors.js";
import { extractIntent, intentToAction } from "../utils/intent.js";
import logger from "../utils/logger.js";

export const agentEvents = new EventEmitter();
const agentStates = new Map();

export const orchestrator = async ({ event, payload, context = {} }) => {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  logger.info({ jobId, event }, "Orchestrator started workflow");

  try {
    const selectedAgents = await selectAgentsForEvent(event, payload);
    const results = await executeAgentsParallel(selectedAgents, payload, context, jobId);
    const decision = makeOrchestrationDecision(results);

    notifyWebSocket({ jobId, status: "completed", event, decision, results });

    return { jobId, status: "success", decision, results };
  } catch (error) {
    logger.error({ jobId, error }, "Orchestrator failed");
    notifyWebSocket({ jobId, status: "failed", event, error: error.message });
    throw new AppError(`Orchestration failed: ${error.message}`, 500, "ORCHESTRATION_FAILED");
  }
};

export async function selectAgentsForEvent(event) {
  const allAgents = await loadAgents();
  const byId = new Map(allAgents.map(agent => [agent.id, agent]));

  if (event === "pull_request.opened" || event === "pull_request.synchronize") {
    return ["governance-review-agent", "code-review-agent", "security-agent", "integrity-agent"].map(id => byId.get(id)).filter(Boolean);
  }

  if (event === "pull_request.ready_for_review") {
    return ["governance-review-agent", "code-review-agent", "security-agent"].map(id => byId.get(id)).filter(Boolean);
  }

  if (event === "check_suite.completed") {
    return ["pr-merge-agent"].map(id => byId.get(id)).filter(Boolean);
  }

  if (event === "repository.health_check") {
    return ["integrity-agent"].map(id => byId.get(id)).filter(Boolean);
  }

  return [byId.get("governance-agent")].filter(Boolean);
}

async function executeAgentsParallel(agents, payload, context, jobId) {
  const work = agents.map(async agent => {
    const start = Date.now();

    try {
      updateAgentState(agent.id, jobId, "running");
      const result = await runSingleAgent(agent, payload, context);
      const outputText = typeof result.output === "string" ? result.output : JSON.stringify(result.output);
      updateAgentState(agent.id, jobId, "completed", outputText);

      return {
        agentId: agent.id,
        agentName: agent.name,
        status: "success",
        result: outputText,
        metadata: result.metadata,
        executionTime: Date.now() - start
      };
    } catch (error) {
      updateAgentState(agent.id, jobId, "failed", null, error.message);
      return {
        agentId: agent.id,
        agentName: agent.name,
        status: "failed",
        error: error.message,
        executionTime: Date.now() - start
      };
    }
  });

  return Promise.all(work);
}

async function runSingleAgent(agent, payload, context) {
  const provider = agent.modelProvider || "openai";
  const keyName = agent.modelKey || "bsm";
  const apiKey = models[provider]?.[keyName] || models[provider]?.default;

  const knowledge = await loadKnowledgeIndex();
  const enrichedContext = {
    ...context,
    knowledge,
    primaryLanguage: context.primaryLanguage || "JavaScript",
    framework: context.framework || "Express"
  };

  const result = await runGPT({
    model: agent.modelName || process.env.OPENAI_MODEL,
    apiKey,
    system: buildSystemPrompt(agent, enrichedContext),
    user: buildUserPrompt(payload, enrichedContext)
  });

  const intent = extractIntent(result);
  const action = intentToAction(intent);

  return {
    output: result,
    metadata: {
      intent,
      action,
      allowed: !action || (agent.actions || []).includes(action)
    }
  };
}

function buildSystemPrompt(agent, context) {
  return `You are ${agent.name}.\nRole: ${agent.role}.\nInstructions: ${agent.instructions}\nRepository context: language=${context.primaryLanguage}, framework=${context.framework}.`;
}

function buildUserPrompt(payload, context) {
  return `Analyze this payload and return JSON with keys decision, score, comments.\nPayload:\n${JSON.stringify(payload, null, 2)}\nKnowledge:\n${context.knowledge.join("\n")}`;
}

function makeOrchestrationDecision(results) {
  const governanceResult = results.find(result => result.agentId === "governance-review-agent");
  const securityResult = results.find(result => result.agentId === "security-agent");
  const codeReviewResult = results.find(result => result.agentId === "code-review-agent");

  // Governance check takes priority
  if (governanceResult) {
    const governanceBlocked =
      governanceResult.status === "failed" ||
      String(governanceResult.result || "").includes("block") ||
      String(governanceResult.result || "").includes("BLOCKED");

    if (governanceBlocked) {
      return { action: "block_pr", reason: "Governance violations detected" };
    }
  }

  const securityBlocked =
    securityResult?.status === "failed" ||
    String(securityResult?.result || "").toUpperCase().includes("CRITICAL");

  if (securityBlocked) {
    return { action: "block_pr", reason: "Security vulnerabilities detected" };
  }

  if (String(codeReviewResult?.result || "").includes("REQUEST_CHANGES")) {
    return { action: "request_changes", reason: "Code quality issues found" };
  }

  const allSuccessful = results.length > 0 && results.every(result => result.status === "success");
  if (allSuccessful) {
    return { action: "approve_and_merge", reason: "All quality gates passed", automated: true };
  }

  return { action: "manual_review", reason: "Inconclusive results from agents" };
}

function updateAgentState(agentId, jobId, status, result = null, error = null) {
  const state = {
    agentId,
    jobId,
    status,
    result,
    error,
    timestamp: new Date().toISOString()
  };
  agentStates.set(`${agentId}_${jobId}`, state);
  agentEvents.emit("stateChange", state);
}

function notifyWebSocket(data) {
  agentEvents.emit("broadcast", data);
}

export function getAgentStates() {
  return Array.from(agentStates.values());
}
