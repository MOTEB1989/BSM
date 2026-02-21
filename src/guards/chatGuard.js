/**
 * Chat Agent Guard
 * Enforces context-based restrictions for chat interface
 * 
 * Rules:
 * - Only agents with "chat" in contexts.allowed can run from chat
 * - Agents with internal_only:true are blocked
 * - Agents with selectable:false are blocked
 * - Agents with terminal_execution must NOT be accessible from chat
 * - Agents requiring approval need admin authorization
 * - Fails closed: blocks execution if registry is unavailable
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
  // Skip validation for direct chat (not an agent)
  if (!agentId || agentId === "direct") {
    return { id: "direct", allowed: true };
  }

  const registry = await loadRegistry();
  
  // Fail closed - if no registry, block execution for security
  if (!registry || !registry.agents) {
    logger.error({ agentId }, "Registry unavailable - blocking agent execution (fail-closed)");
    throw new Error("Agent registry unavailable - cannot verify security permissions");
  }

  // Find agent in registry
  const agent = registry.agents.find(a => a.id === agentId);
  if (!agent) {
    logger.error({ agentId }, "Agent not found in registry");
    throw new Error(`Agent "${agentId}" not found in registry`);
  }

  // Check 1: Chat context allowed?
  const contexts = agent.contexts?.allowed || [];
  if (!contexts.includes("chat")) {
    logger.warn({ 
      agentId, 
      contexts,
      isAdmin 
    }, "Agent blocked: not allowed in chat context");
    throw new Error(`Agent "${agentId}" is not allowed in chat context`);
  }

  // Check 2: Terminal execution agents must never be in chat
  const capabilities = agent.capabilities || [];
  if (capabilities.includes("terminal_execution")) {
    logger.error({ 
      agentId, 
      capabilities,
      contexts
    }, "Agent blocked: terminal_execution agents cannot run in chat");
    throw new Error(`Agent "${agentId}" has terminal_execution capability and cannot run in chat`);
  }

  // Check 3: Internal-only agents blocked
  if (agent.expose?.internal_only === true) {
    logger.warn({ 
      agentId, 
      internal_only: true,
      isAdmin 
    }, "Agent blocked: internal_only agents cannot run in chat");
    throw new Error(`Agent "${agentId}" is internal-only and cannot run in chat`);
  }

  // Check 4: Non-selectable agents blocked
  if (agent.expose?.selectable === false) {
    logger.warn({ 
      agentId, 
      selectable: false,
      isAdmin 
    }, "Agent blocked: non-selectable agents cannot run in chat");
    throw new Error(`Agent "${agentId}" is not selectable for chat execution`);
  }

  // Check 5: Destructive agents blocked in chat
  if (agent.safety?.mode === "destructive") {
    logger.warn({ 
      agentId, 
      safetyMode: agent.safety.mode,
      isAdmin 
    }, "Agent blocked: destructive mode not allowed in chat");
    throw new Error(`Agent "${agentId}" is destructive and cannot run in chat`);
  }

  // Check 6: Approval required?
  if (agent.approval?.required && !isAdmin) {
    logger.warn({ 
      agentId, 
      approvalRequired: true,
      isAdmin 
    }, "Agent blocked: requires admin approval");
    throw new Error(`Agent "${agentId}" requires admin approval`);
  }

  // Check 7: Risk level warning for high/critical
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
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Promise<Array>} List of agent IDs allowed in chat context
 */
export async function getAvailableChatAgents(isAdmin = false) {
  const registry = await loadRegistry();
  
  if (!registry || !registry.agents) {
    return [];
  }

  return registry.agents
    .filter(agent => {
      const contexts = agent.contexts?.allowed || [];
      const hasChat = contexts.includes("chat");
      const capabilities = agent.capabilities || [];
      const hasTerminalExecution = capabilities.includes("terminal_execution");
      const isInternalOnly = agent.expose?.internal_only === true;
      const isSelectable = agent.expose?.selectable !== false;
      const isDestructive = agent.safety?.mode === "destructive";
      const needsApproval = agent.approval?.required && !isAdmin;
      
      // Also check risk level - high/critical requires admin
      const isHighRisk = (agent.risk?.level === "high" || agent.risk?.level === "critical") && !isAdmin;
      
      return hasChat 
        && !hasTerminalExecution 
        && !isInternalOnly 
        && isSelectable 
        && !isDestructive 
        && !needsApproval 
        && !isHighRisk;
    })
    .map(agent => ({
      id: agent.id,
      name: agent.name,
      category: agent.category,
      risk: agent.risk?.level
    }));
}
