import { agentStateService } from "../services/agentStateService.js";
import { loadAgents } from "../services/agentsService.js";
import { auditLogger } from "../utils/auditLogger.js";
import logger from "../utils/logger.js";
import { AppError } from "../utils/errors.js";
import { loadRegistry } from "../utils/registryCache.js";

/**
 * POST /api/agents/start/:agentId
 * Start an agent
 */
export const startAgent = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    
    // Load registry to get agent config
    const registry = await loadRegistry();
    const agentConfig = registry.agents.find(a => a.id === agentId);
    
    if (!agentConfig) {
      throw new AppError(`Agent ${agentId} not found in registry`, 404, "AGENT_NOT_FOUND");
    }
    
    // Check approval requirements
    if (agentConfig.approval.required) {
      const { approvalToken } = req.body;
      if (!approvalToken) {
        throw new AppError(
          `Agent ${agentId} requires approval. Provide approvalToken in request body.`,
          403,
          "APPROVAL_REQUIRED"
        );
      }
      // In production, validate approval token against approval system
      logger.info({ agentId, approvalType: agentConfig.approval.type }, "Agent approval check");
    }
    
    // Start the agent
    const result = agentStateService.startAgent(agentId, agentConfig);
    
    // Audit log
    auditLogger.logAgentOperation({
      action: "start",
      agentId,
      success: true,
      user: req.user || "system",
      ip: req.ip,
      correlationId: req.correlationId
    });
    
    logger.info({
      agentId,
      correlationId: req.correlationId
    }, "Agent start requested");
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    // Audit log failure
    auditLogger.logAgentOperation({
      action: "start",
      agentId: req.params.agentId,
      success: false,
      user: req.user || "system",
      ip: req.ip,
      reason: error.message,
      correlationId: req.correlationId
    });
    next(error);
  }
};

/**
 * POST /api/agents/stop/:agentId
 * Stop an agent
 */
export const stopAgent = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    
    const result = agentStateService.stopAgent(agentId);
    
    // Audit log
    auditLogger.logAgentOperation({
      action: "stop",
      agentId,
      success: true,
      user: req.user || "system",
      ip: req.ip,
      correlationId: req.correlationId
    });
    
    logger.info({
      agentId,
      correlationId: req.correlationId
    }, "Agent stop requested");
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    // Audit log failure
    auditLogger.logAgentOperation({
      action: "stop",
      agentId: req.params.agentId,
      success: false,
      user: req.user || "system",
      ip: req.ip,
      reason: error.message,
      correlationId: req.correlationId
    });
    next(error);
  }
};

/**
 * GET /api/agents/status
 * Get status of all agents
 */
export const getAgentsStatus = async (req, res, next) => {
  try {
    const allStates = agentStateService.getAllAgentsStatus();
    
    // Load registry to include config info
    const registry = await loadRegistry();
    const agents = await loadAgents();
    
    const result = registry.agents.map(agentConfig => {
      const state = allStates[agentConfig.id];
      const agentData = agents.find(a => a.id === agentConfig.id);
      
      return {
        id: agentConfig.id,
        name: agentConfig.name,
        category: agentConfig.category,
        risk: agentConfig.risk.level,
        state: state || { status: "stopped" },
        config: {
          autoStart: agentConfig.startup.auto_start,
          allowedProfiles: agentConfig.startup.allowed_profiles,
          contexts: agentConfig.contexts.allowed,
          approvalRequired: agentConfig.approval.required
        }
      };
    });
    
    res.json({
      timestamp: new Date().toISOString(),
      totalAgents: result.length,
      runningAgents: result.filter(a => a.state.status === "running").length,
      agents: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/agents/:agentId/status
 * Get status of a specific agent
 */
export const getAgentStatus = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    
    const registry = await loadRegistry();
    const agentConfig = registry.agents.find(a => a.id === agentId);
    
    if (!agentConfig) {
      throw new AppError(`Agent ${agentId} not found`, 404, "AGENT_NOT_FOUND");
    }
    
    const state = agentStateService.getAgentStatus(agentId);
    
    res.json({
      id: agentId,
      name: agentConfig.name,
      state: state || { status: "stopped" },
      config: {
        category: agentConfig.category,
        risk: agentConfig.risk,
        approval: agentConfig.approval,
        startup: agentConfig.startup,
        contexts: agentConfig.contexts.allowed
      }
    });
  } catch (error) {
    next(error);
  }
};
