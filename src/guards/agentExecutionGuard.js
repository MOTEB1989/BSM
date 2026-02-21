/**
 * Agent Execution Guard
 * Enforces security constraints for agent execution via /api/agents/run
 * 
 * Rules:
 * - Agents requiring approval need admin authentication
 * - Agents with terminal_execution capability require admin authentication
 * - Agents with high/critical risk require admin authentication
 * - Validates context restrictions
 */

import { loadRegistry } from "../utils/registryCache.js";
import logger from "../utils/logger.js";

/**
 * Guard agent execution via /api/agents/run
 * 
 * @param {string} agentId - Agent identifier
 * @param {boolean} isAdmin - Whether the request has valid admin authentication
 * @param {string} context - Execution context (e.g., "api", "ci", "chat")
 * @returns {Promise<object>} Agent configuration if allowed
 * @throws {Error} If agent execution is not allowed
 */
export async function guardAgentExecution(agentId, isAdmin = false, context = "api") {
  const registry = await loadRegistry();
  
  // Fail closed: if no registry, block execution for security
  if (!registry || !registry.agents) {
    logger.error({ agentId, context }, "No registry found, blocking agent execution (fail-closed)");
    throw new Error("Agent registry unavailable. Cannot validate agent security constraints.");
  }

  // Find agent in registry
  const agent = registry.agents.find(a => a.id === agentId);
  if (!agent) {
    logger.error({ agentId, context }, "Agent not found in registry");
    throw new Error(`Agent "${agentId}" not found in registry`);
  }

  // Check 1: Context allowed?
  const contexts = agent.contexts?.allowed || [];
  if (!contexts.includes(context)) {
    logger.warn({ 
      agentId, 
      contexts,
      requestedContext: context,
      isAdmin 
    }, "Agent blocked: context not allowed");
    throw new Error(`Agent "${agentId}" is not allowed in ${context} context`);
  }

  // Check 2: Terminal execution requires admin
  const actions = agent.actions || [];
  const hasTerminalExecution = actions.includes("terminal_execution") || actions.includes("execute_command");
  if (hasTerminalExecution && !isAdmin) {
    logger.warn({ 
      agentId, 
      hasTerminalExecution,
      isAdmin 
    }, "Agent blocked: terminal execution requires admin");
    throw new Error(`Agent "${agentId}" has terminal execution capability and requires admin authorization`);
  }

  // Check 3: Approval required?
  if (agent.approval?.required && !isAdmin) {
    logger.warn({ 
      agentId, 
      approvalRequired: true,
      isAdmin 
    }, "Agent blocked: requires admin approval");
    throw new Error(`Agent "${agentId}" requires admin approval`);
  }

  // Check 4: Risk level - high/critical requires admin
  if ((agent.risk?.level === "high" || agent.risk?.level === "critical") && !isAdmin) {
    logger.warn({ 
      agentId, 
      riskLevel: agent.risk.level,
      isAdmin 
    }, "Agent blocked: high/critical risk requires admin");
    throw new Error(`Agent "${agentId}" has ${agent.risk.level} risk and requires admin authorization`);
  }

  // Check 5: Internal-only agents require admin
  if (agent.expose?.internal_only === true && !isAdmin) {
    logger.warn({ 
      agentId, 
      isAdmin 
    }, "Agent blocked: internal_only agents require admin");
    throw new Error(`Agent "${agentId}" is internal only and requires admin authorization`);
  }

  logger.info({ 
    agentId, 
    contexts,
    hasTerminalExecution,
    riskLevel: agent.risk?.level,
    isAdmin,
    context
  }, "Agent execution guard passed");

  return agent;
}
