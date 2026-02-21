/**
 * Chat Agent Guard
 * Enforces context-based restrictions for chat UI
 * 
 * Rules:
 * - Only agents with "chat" in contexts.allowed can run
 * - internal_only agents are blocked
 * - Non-selectable agents are blocked
 * - Destructive agents are blocked
 * - Agents with terminal_execution are blocked
 * - Fail-closed: if registry unavailable, block execution
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
  
  // Fail-closed: If no registry, block execution for security
  if (!registry || !registry.agents) {
    logger.error({ agentId }, "Registry unavailable - blocking chat agent execution (fail-closed)");
    throw new Error("Agent registry unavailable - chat execution blocked for security");
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
    throw new Error(`Agent "${agentId}" is not available in chat UI`);
  }

  // Check 2: Internal-only agents blocked in chat
  if (agent.internal_only === true) {
    logger.warn({ 
      agentId,
      isAdmin 
    }, "Agent blocked: internal_only agents not allowed in chat");
    throw new Error(`Agent "${agentId}" is internal-only and cannot run in chat UI`);
  }

  // Check 3: Non-selectable agents blocked in chat
  if (agent.selectable === false) {
    logger.warn({ 
      agentId,
      isAdmin 
    }, "Agent blocked: non-selectable agents not allowed in chat");
    throw new Error(`Agent "${agentId}" is not selectable in chat UI`);
  }

  // Check 4: Destructive agents blocked in chat
  if (agent.safety?.mode === "destructive") {
    logger.warn({ 
      agentId, 
      safetyMode: agent.safety.mode,
      isAdmin 
    }, "Agent blocked: destructive mode not allowed in chat");
    throw new Error(`Agent "${agentId}" is destructive and cannot run in chat UI`);
  }

  // Check 5: Terminal execution capability blocked in chat
  const capabilities = agent.capabilities || [];
  if (capabilities.includes("terminal_execution")) {
    logger.warn({ 
      agentId, 
      capabilities,
      isAdmin 
    }, "Agent blocked: terminal_execution capability not allowed in chat");
    throw new Error(`Agent "${agentId}" has terminal execution capability and cannot run in chat UI`);
  }

  // Check 6: Approval required? (admins can bypass in some cases, but log it)
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
    capabilities,
    isAdmin 
  }, "Chat agent guard passed");

  return agent;
}

/**
 * Get list of agents allowed in chat context
 * 
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Promise<Array>} List of agent objects with id, name, category, and risk properties
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
      const isInternalOnly = agent.internal_only === true;
      const isNonSelectable = agent.selectable === false;
      const isDestructive = agent.safety?.mode === "destructive";
      const hasTerminalExec = (agent.capabilities || []).includes("terminal_execution");
      const needsApproval = agent.approval?.required && !isAdmin;
      
      // Also check risk level - high/critical requires admin
      const isHighRisk = (agent.risk?.level === "high" || agent.risk?.level === "critical") && !isAdmin;
      
      return hasChat && !isInternalOnly && !isNonSelectable && !isDestructive && !hasTerminalExec && !needsApproval && !isHighRisk;
    })
    .map(agent => ({
      id: agent.id,
      name: agent.name,
      category: agent.category,
      risk: agent.risk?.level
    }));
}
