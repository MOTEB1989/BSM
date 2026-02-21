/**
 * Chat Agent Guard
 * Enforces context-based restrictions for chat interface
 * 
 * Rules:
 * - Only agents with "chat" in contexts.allowed can run from chat UI
 * - Agents with internal_only:true or selectable:false are blocked
 * - Terminal execution agents without "chat" context are blocked
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
  const registry = await loadRegistry();
  
  // Fail closed for security - if no registry, block execution
  if (!registry || !registry.agents) {
    logger.error({ agentId }, "No registry found, blocking chat agent execution");
    throw new Error("Agent registry unavailable - access denied for security");
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

  // Check 2: Internal only agents blocked
  if (agent.expose?.internal_only === true) {
    logger.warn({ 
      agentId,
      isAdmin 
    }, "Agent blocked: internal_only agent cannot be accessed from chat");
    throw new Error(`Agent "${agentId}" is internal only and cannot be accessed from chat`);
  }

  // Check 3: Non-selectable agents blocked
  if (agent.expose?.selectable === false) {
    logger.warn({ 
      agentId,
      isAdmin 
    }, "Agent blocked: non-selectable agent cannot be accessed from chat");
    throw new Error(`Agent "${agentId}" is not selectable in chat interface`);
  }

  // Check 4: Terminal execution agents without chat context
  const capabilities = agent.capabilities || [];
  if (capabilities.includes("terminal_execution") && !contexts.includes("chat")) {
    logger.warn({ 
      agentId, 
      capabilities,
      contexts,
      isAdmin 
    }, "Agent blocked: terminal execution agent without chat context");
    throw new Error(`Agent "${agentId}" has terminal execution capability and is not allowed in chat context`);
  }

  // Check 5: Approval required?
  if (agent.approval?.required && !isAdmin) {
    logger.warn({ 
      agentId, 
      approvalRequired: true,
      isAdmin 
    }, "Agent blocked: requires admin approval");
    throw new Error(`Agent "${agentId}" requires admin approval`);
  }

  // Check 6: Risk level warning for high/critical
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
      const isInternalOnly = agent.expose?.internal_only === true;
      const isNonSelectable = agent.expose?.selectable === false;
      const needsApproval = agent.approval?.required && !isAdmin;
      
      // Also check risk level - high/critical requires admin
      const isHighRisk = (agent.risk?.level === "high" || agent.risk?.level === "critical") && !isAdmin;
      
      return hasChat && !isInternalOnly && !isNonSelectable && !needsApproval && !isHighRisk;
    })
    .map(agent => ({
      id: agent.id,
      name: agent.name,
      category: agent.category,
      risk: agent.risk?.level
    }));
}
