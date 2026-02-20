import EventEmitter from "events";
import { loadAgents } from "../services/agentsService.js";
import { loadKnowledgeIndex } from "../services/knowledgeService.js";
import { models } from "../config/models.js";
import { runGPT } from "../services/gptService.js";
import { AppError } from "../utils/errors.js";
import { extractIntent, intentToAction } from "../utils/intent.js";
import { getAgentsForEvent, getExecutionStrategy } from "../config/orchestratorEvents.js";
import logger from "../utils/logger.js";

export const agentEvents = new EventEmitter();
const agentStates = new Map();

// TTL-based cleanup for agentStates
const STATE_TTL = 3600000; // 1 hour
const MAX_STATES = 1000; // Maximum states to keep

/**
 * Helper function to serialize output once and reuse
 * Avoids repeated JSON.stringify calls for the same data
 */
function serializeOutput(output) {
  return typeof output === "string" ? output : JSON.stringify(output);
}

// Cleanup old states periodically
// Using unref() to allow Node.js to exit when tests complete
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  const stateEntries = Array.from(agentStates.entries());
  
  for (const [key, state] of stateEntries) {
    const stateAge = now - new Date(state.timestamp).getTime();
    if (stateAge > STATE_TTL) {
      agentStates.delete(key);
    }
  }
  
  // If still too many, remove oldest
  if (agentStates.size > MAX_STATES) {
    const sortedStates = stateEntries.sort((a, b) => 
      new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime()
    );
    const toRemove = agentStates.size - MAX_STATES;
    for (let i = 0; i < toRemove; i++) {
      agentStates.delete(sortedStates[i][0]);
    }
  }
}, 300000).unref(); // Clean up every 5 minutes, unref to allow tests to exit

export const orchestrator = async ({ event, payload, context = {} }) => {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  logger.info({ jobId, event }, "Orchestrator started workflow");

  try {
    const selectedAgents = await selectAgentsForEvent(event, payload);
    const executionStrategy = getExecutionStrategy(event);
    
    const results = executionStrategy === "parallel" 
      ? await executeAgentsParallel(selectedAgents, payload, context, jobId)
      : await executeAgentsSequential(selectedAgents, payload, context, jobId);
      
    const decision = makeOrchestrationDecision(results);

    notifyWebSocket({ jobId, status: "completed", event, decision, results });

    return { jobId, status: "success", decision, results };
  } catch (error) {
    logger.error({ jobId, error }, "Orchestrator failed");
    notifyWebSocket({ jobId, status: "failed", event, error: error.message });
    throw new AppError(`Orchestration failed: ${error.message}`, 500, "ORCHESTRATION_FAILED");
  } finally {
    // Clean up job-specific state after a delay to allow final event processing
    // Using unref() to prevent blocking process exit
    const cleanupTimer = setTimeout(() => {
      const keysToRemove = Array.from(agentStates.keys()).filter(key => key.endsWith(`_${jobId}`));
      keysToRemove.forEach(key => agentStates.delete(key));
      logger.debug({ jobId, cleanedKeys: keysToRemove.length }, "Cleaned up job state");
    }, 60000); // Cleanup after 1 minute
    cleanupTimer.unref();
  }
};

/**
 * Select agents for an event using configuration-based routing
 * @param {string} event - Event identifier
 * @param {object} payload - Event payload (for future dynamic selection)
 * @returns {Promise<Array>} Array of agent objects
 */
export async function selectAgentsForEvent(event, payload) {
  const allAgents = await loadAgents();
  const byId = new Map(allAgents.map(agent => [agent.id, agent]));
  
  // Get agent IDs from configuration
  const agentIds = getAgentsForEvent(event);
  
  // Map IDs to agent objects
  const selectedAgents = agentIds
    .map(id => byId.get(id))
    .filter(Boolean); // Remove any agents not found
  
  logger.info({ 
    event, 
    requestedAgents: agentIds, 
    foundAgents: selectedAgents.map(a => a.id)
  }, "Agents selected for event");
  
  return selectedAgents;
}

async function executeAgentsParallel(agents, payload, context, jobId) {
  const work = agents.map(async agent => {
    const start = Date.now();

    try {
      updateAgentState(agent.id, jobId, "running");
      const result = await runSingleAgent(agent, payload, context);
      const outputText = serializeOutput(result.output); // Use helper to avoid repeated serialization
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

/**
 * Execute agents sequentially (one after another)
 * Useful for workflows where order matters or to reduce load
 */
async function executeAgentsSequential(agents, payload, context, jobId) {
  const results = [];
  
  for (const agent of agents) {
    const start = Date.now();
    
    try {
      updateAgentState(agent.id, jobId, "running");
      const result = await runSingleAgent(agent, payload, context);
      const outputText = serializeOutput(result.output); // Use helper to avoid repeated serialization
      updateAgentState(agent.id, jobId, "completed", outputText);
      
      results.push({
        agentId: agent.id,
        agentName: agent.name,
        status: "success",
        result: outputText,
        metadata: result.metadata,
        executionTime: Date.now() - start
      });
    } catch (error) {
      updateAgentState(agent.id, jobId, "failed", null, error.message);
      results.push({
        agentId: agent.id,
        agentName: agent.name,
        status: "failed",
        error: error.message,
        executionTime: Date.now() - start
      });
      
      // Optional: Stop on first failure
      // break;
    }
  }
  
  return results;
}

async function runSingleAgent(agent, payload, context) {
  const provider = agent.modelProvider || "openai";
  const keyName = agent.modelKey || "bsm";
  const apiKey = models[provider]?.[keyName] || models[provider]?.default;

  const knowledge = await loadKnowledgeIndex();
  const knowledgeString = knowledge.join("\n"); // Compute once
  
  const enrichedContext = {
    ...context,
    knowledge,
    knowledgeString, // Add pre-computed string
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
  // Limit payload size for serialization (serialize once and reuse)
  const MAX_PAYLOAD_SIZE = 50000; // 50KB
  const payloadStr = JSON.stringify(payload, null, 2);
  const truncatedPayload = payloadStr.length > MAX_PAYLOAD_SIZE
    ? payloadStr.slice(0, MAX_PAYLOAD_SIZE) + "\n... [truncated]"
    : payloadStr;
  
  // Use pre-computed knowledge string if available
  const knowledgeStr = context.knowledgeString || context.knowledge.join("\n");
  
  return `Analyze this payload and return JSON with keys decision, score, comments.\nPayload:\n${truncatedPayload}\nKnowledge:\n${knowledgeStr}`;
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
