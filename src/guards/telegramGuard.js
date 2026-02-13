/**
 * Telegram Agent Guard
 * Enforces context-based restrictions for Telegram (mobile mode)
 * 
 * Rules:
 * - Only agents with "mobile" in contexts.allowed can run
 * - Destructive agents are blocked
 * - Agents requiring approval need admin authorization
 */

import { loadRegistry } from "../utils/registryCache.js";
import logger from "../utils/logger.js";

/**
 * Guard Telegram agent execution
 * 
 * @param {string} agentId - Agent identifier
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Promise<object>} Agent configuration if allowed
 * @throws {Error} If agent is not allowed in Telegram/mobile context
 */
export async function guardTelegramAgent(agentId, isAdmin = false) {
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

  // Check 1: Mobile context allowed?
  const contexts = agent.contexts?.allowed || [];
  if (!contexts.includes("mobile")) {
    logger.warn({ 
      agentId, 
      contexts,
      isAdmin 
    }, "Agent blocked: not allowed in mobile context");
    throw new Error(`Agent "${agentId}" is not allowed in Telegram (mobile context)`);
  }

  // Check 2: Destructive agents blocked in Telegram
  if (agent.safety?.mode === "destructive") {
    logger.warn({ 
      agentId, 
      safetyMode: agent.safety.mode,
      isAdmin 
    }, "Agent blocked: destructive mode not allowed in Telegram");
    throw new Error(`Agent "${agentId}" is destructive and cannot run in Telegram`);
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

  // Check 4: Risk level warning for high/critical
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
  }, "Telegram agent guard passed");

  return agent;
}

/**
 * Get list of agents allowed in mobile/Telegram context
 * 
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Promise<Array>} List of agent IDs allowed in mobile context
 */
export async function getAvailableTelegramAgents(isAdmin = false) {
  const registry = await loadRegistry();
  
  if (!registry || !registry.agents) {
    return [];
  }

  return registry.agents
    .filter(agent => {
      const contexts = agent.contexts?.allowed || [];
      const hasMobile = contexts.includes("mobile");
      const isDestructive = agent.safety?.mode === "destructive";
      const needsApproval = agent.approval?.required && !isAdmin;
      
      // Also check risk level - high/critical requires admin
      const isHighRisk = (agent.risk?.level === "high" || agent.risk?.level === "critical") && !isAdmin;
      
      return hasMobile && !isDestructive && !needsApproval && !isHighRisk;
    })
    .map(agent => ({
      id: agent.id,
      name: agent.name,
      category: agent.category,
      risk: agent.risk?.level
    }));
}
