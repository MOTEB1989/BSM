/**
 * Agent Execution Guard
 * Enforces context-based restrictions for agent execution endpoint
 * 
 * Rules:
 * - Validates agent exists in registry
 * - Enforces context restrictions based on execution mode
 * - Requires admin authentication for agents needing approval
 * - Blocks destructive agents unless admin
 * - Blocks high/critical risk agents unless admin
 * - Fail-closed: blocks all agents if registry unavailable
 */

import { loadRegistry } from "../utils/registryCache.js";
import logger from "../utils/logger.js";

/**
 * Guard agent execution
 * 
 * @param {string} agentId - Agent identifier
 * @param {string} context - Execution context (api, ci, chat, mobile, github, system, security)
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Promise<object>} Agent configuration if allowed
 * @throws {Error} If agent is not allowed in the specified context
 */
export async function guardAgentExecution(agentId, context = "api", isAdmin = false) {
  const registry = await loadRegistry();
  
  // Fail-closed: if no registry, block all agent execution
  if (!registry || !registry.agents) {
    logger.error({ agentId, context }, "Registry unavailable - blocking agent execution (fail-closed)");
    throw new Error("Agent registry unavailable - execution blocked for security");
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
      context,
      allowedContexts: contexts,
      isAdmin 
    }, "Agent blocked: not allowed in specified context");
    throw new Error(`Agent "${agentId}" is not allowed in "${context}" context`);
  }

  // Check 2: Approval required?
  if (agent.approval?.required && !isAdmin) {
    logger.warn({ 
      agentId, 
      context,
      approvalRequired: true,
      isAdmin 
    }, "Agent blocked: requires admin approval");
    throw new Error(`Agent "${agentId}" requires admin approval`);
  }

  // Check 3: Destructive agents require admin
  if (agent.safety?.mode === "destructive" && !isAdmin) {
    logger.warn({ 
      agentId, 
      context,
      safetyMode: agent.safety.mode,
      isAdmin 
    }, "Agent blocked: destructive mode requires admin");
    throw new Error(`Agent "${agentId}" is destructive and requires admin authorization`);
  }

  // Check 4: Risk level - high/critical requires admin
  if ((agent.risk?.level === "high" || agent.risk?.level === "critical") && !isAdmin) {
    logger.warn({ 
      agentId, 
      context,
      riskLevel: agent.risk.level,
      isAdmin 
    }, "Agent blocked: high/critical risk requires admin");
    throw new Error(`Agent "${agentId}" has ${agent.risk.level} risk and requires admin authorization`);
  }

  logger.info({ 
    agentId, 
    context,
    contexts,
    safetyMode: agent.safety?.mode,
    riskLevel: agent.risk?.level,
    isAdmin 
  }, "Agent execution guard passed");

  return agent;
}

/**
 * Get list of agents allowed in specified context
 * 
 * @param {string} context - Execution context
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Promise<Array>} List of agent IDs allowed in the context
 */
export async function getAvailableAgentsForContext(context = "api", isAdmin = false) {
  const registry = await loadRegistry();
  
  if (!registry || !registry.agents) {
    return [];
  }

  return registry.agents
    .filter(agent => {
      const contexts = agent.contexts?.allowed || [];
      const hasContext = contexts.includes(context);
      const isDestructive = agent.safety?.mode === "destructive";
      const needsApproval = agent.approval?.required && !isAdmin;
      
      // Also check risk level - high/critical requires admin
      const isHighRisk = (agent.risk?.level === "high" || agent.risk?.level === "critical") && !isAdmin;
      
      return hasContext && !isDestructive && !needsApproval && !isHighRisk;
    })
    .map(agent => ({
      id: agent.id,
      name: agent.name,
      category: agent.category,
      risk: agent.risk?.level
    }));
}
