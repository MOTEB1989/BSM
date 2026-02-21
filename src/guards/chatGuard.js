/**
 * Chat Agent Guard
 * Enforces context-based restrictions for chat interface
 * 
 * Rules:
 * - Only agents with "chat" in contexts.allowed can run
 * - Agents with terminal_execution must be restricted to api/ci contexts only
 * - Agents requiring approval need admin authorization
 */

import { loadRegistry } from "../utils/registryCache.js";
import logger from "../utils/logger.js";

/**
 * Guard chat agent execution
 * 
 * @param {string} agentId - Agent identifier
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Promise<object>} Agent configuration if allowed
 * @throws {Error} If agent is not allowed in chat context
 */
export async function guardChatAgent(agentId, isAdmin = false) {
  // Special agents that bypass guard (direct chat, agent-auto routing)
  const bypassAgents = ['direct', 'agent-auto', 'kimi-agent'];
  if (bypassAgents.includes(agentId)) {
    return { id: agentId, allowed: true };
  }

  const registry = await loadRegistry();
  
  // If no registry, be permissive (backward compatibility)
  if (!registry || !registry.agents) {
    logger.warn({ agentId }, "No registry found, allowing agent execution");
    return { id: agentId, allowed: true };
  }

  // Find agent in registry
  const agent = registry.agents.find(a => a.id === agentId);
  if (!agent) {
    logger.error({ agentId }, "Agent not found in registry");
    throw new Error(`Agent "${agentId}" not found in registry`);
  }

  // Check 1: Chat context allowed?
  const contexts = agent.contexts?.allowed || [];
  if (!contexts.includes("chat") && !contexts.includes("api")) {
    logger.warn({ 
      agentId, 
      contexts,
      isAdmin 
    }, "Agent blocked: not allowed in chat context");
    throw new Error(`Agent "${agentId}" is not allowed in chat interface (restricted to ${contexts.join(', ')} contexts)`);
  }

  // Check 2: Agents with terminal_execution must not be accessible from chat
  const capabilities = agent.capabilities || [];
  if (capabilities.includes('terminal_execution') && !contexts.includes("chat")) {
    logger.warn({ 
      agentId, 
      contexts,
      capabilities,
      isAdmin 
    }, "Agent blocked: terminal_execution agents restricted to api/ci contexts");
    throw new Error(`Agent "${agentId}" has terminal execution capability and cannot run from chat interface`);
  }

  // Check 3: Destructive agents blocked in chat
  if (agent.safety?.mode === "destructive") {
    logger.warn({ 
      agentId, 
      safetyMode: agent.safety.mode,
      isAdmin 
    }, "Agent blocked: destructive mode not allowed in chat");
    throw new Error(`Agent "${agentId}" is destructive and cannot run from chat interface`);
  }

  // Check 4: Approval required?
  if (agent.approval?.required && !isAdmin) {
    logger.warn({ 
      agentId, 
      approvalRequired: true,
      isAdmin 
    }, "Agent blocked: requires admin approval");
    throw new Error(`Agent "${agentId}" requires admin approval`);
  }

  // Check 5: Risk level warning for high/critical
  if (agent.risk?.level === "high" || agent.risk?.level === "critical") {
    if (!isAdmin) {
      logger.warn({ 
        agentId, 
        riskLevel: agent.risk.level,
        isAdmin 
      }, "Agent blocked: high/critical risk requires admin");
      throw new Error(`Agent "${agentId}" has ${agent.risk.level} risk and requires admin authorization`);
    } else {
      logger.info({ 
        agentId, 
        riskLevel: agent.risk.level,
        isAdmin 
      }, "High/critical risk agent allowed for admin");
    }
  }

  logger.info({ 
    agentId, 
    contexts,
    safetyMode: agent.safety?.mode,
    riskLevel: agent.risk?.level,
    isAdmin 
  }, "Chat agent guard passed");

  return agent;
}

/**
 * Get list of agents allowed in chat context
 * 
 * @returns {Promise<Array>} List of agent IDs allowed in chat
 */
export async function getChatAllowedAgents() {
  const registry = await loadRegistry();
  
  if (!registry || !registry.agents) {
    return [];
  }

  return registry.agents
    .filter(agent => {
      const contexts = agent.contexts?.allowed || [];
      const capabilities = agent.capabilities || [];
      
      // Must have chat or api context
      const hasValidContext = contexts.includes("chat") || contexts.includes("api");
      
      // Must not have terminal_execution if only api/ci contexts
      const hasTerminalExec = capabilities.includes('terminal_execution');
      const hasChatContext = contexts.includes("chat");
      
      return hasValidContext && (!hasTerminalExec || hasChatContext);
    })
    .map(agent => agent.id);
}
