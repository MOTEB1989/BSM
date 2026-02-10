import logger from "../utils/logger.js";
import { env } from "../config/env.js";

/**
 * Agent State Management Service
 * Manages agent lifecycle: start, stop, status tracking
 * Enforces no auto-start policy and profile-based access control
 */

class AgentStateService {
  constructor() {
    // In-memory state store (in production, use Redis or similar)
    this.agentStates = new Map();
    this.startTimes = new Map();
  }

  /**
   * Start an agent
   * @param {string} agentId - The agent ID to start
   * @param {Object} agentConfig - Agent configuration from registry
   * @returns {Object} Start result
   */
  startAgent(agentId, agentConfig) {
    // Check if agent is already running
    if (this.isAgentRunning(agentId)) {
      throw new Error(`Agent ${agentId} is already running`);
    }

    // Validate profile access
    const currentProfile = env.nodeEnv === "production" ? "production" : 
                          env.nodeEnv === "staging" ? "staging" : "development";
    
    if (!agentConfig.startup.allowed_profiles.includes(currentProfile)) {
      throw new Error(
        `Agent ${agentId} is not allowed to run in ${currentProfile} profile. ` +
        `Allowed profiles: ${agentConfig.startup.allowed_profiles.join(", ")}`
      );
    }

    // Check safe mode restrictions
    if (env.safeMode && agentConfig.contexts.allowed.some(ctx => 
      ["github", "ci", "system", "security"].includes(ctx)
    )) {
      throw new Error(
        `Agent ${agentId} requires external access but SAFE_MODE is enabled`
      );
    }

    // Start the agent
    this.agentStates.set(agentId, {
      status: "running",
      startedAt: new Date().toISOString(),
      profile: currentProfile,
      pid: null // Would be actual PID in production
    });
    this.startTimes.set(agentId, Date.now());

    logger.info({
      agentId,
      profile: currentProfile,
      contexts: agentConfig.contexts.allowed
    }, "Agent started");

    return {
      agentId,
      status: "running",
      message: `Agent ${agentId} started successfully`
    };
  }

  /**
   * Stop an agent
   * @param {string} agentId - The agent ID to stop
   * @returns {Object} Stop result
   */
  stopAgent(agentId) {
    const state = this.agentStates.get(agentId);
    
    if (!state || state.status !== "running") {
      throw new Error(`Agent ${agentId} is not running`);
    }

    const startTime = this.startTimes.get(agentId);
    const uptime = startTime ? Date.now() - startTime : 0;

    this.agentStates.set(agentId, {
      ...state,
      status: "stopped",
      stoppedAt: new Date().toISOString(),
      uptime
    });

    logger.info({
      agentId,
      uptime: `${uptime}ms`
    }, "Agent stopped");

    return {
      agentId,
      status: "stopped",
      uptime,
      message: `Agent ${agentId} stopped successfully`
    };
  }

  /**
   * Get agent status
   * @param {string} agentId - The agent ID
   * @returns {Object|null} Agent state or null if not found
   */
  getAgentStatus(agentId) {
    return this.agentStates.get(agentId) || null;
  }

  /**
   * Check if agent is running
   * @param {string} agentId - The agent ID
   * @returns {boolean}
   */
  isAgentRunning(agentId) {
    const state = this.agentStates.get(agentId);
    return state && state.status === "running";
  }

  /**
   * Get all agents status
   * @returns {Object} Map of agent states
   */
  getAllAgentsStatus() {
    const allStates = {};
    for (const [agentId, state] of this.agentStates.entries()) {
      allStates[agentId] = {
        ...state,
        uptime: state.status === "running" && this.startTimes.has(agentId)
          ? Date.now() - this.startTimes.get(agentId)
          : null
      };
    }
    return allStates;
  }

  /**
   * Reset all agent states (used for testing or emergency shutdown)
   */
  resetAll() {
    logger.warn("Resetting all agent states");
    this.agentStates.clear();
    this.startTimes.clear();
  }
}

// Export singleton instance
export const agentStateService = new AgentStateService();
