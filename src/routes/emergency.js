import { Router } from "express";
import { auditLogger } from "../utils/auditLogger.js";
import { agentStateService } from "../services/agentStateService.js";
import logger from "../utils/logger.js";
import { env } from "../config/env.js";

const router = Router();

/**
 * POST /api/emergency/shutdown
 * Emergency kill-switch endpoint
 * Stops all running agents and prepares for graceful shutdown
 * Requires admin authentication
 */
router.post("/shutdown", (req, res) => {
  const { reason, token } = req.body;
  
  // Verify admin token
  if (!token || token !== env.adminToken) {
    auditLogger.logAccessDenied({
      resource: "/api/emergency/shutdown",
      action: "shutdown",
      reason: "Invalid or missing admin token",
      ip: req.ip,
      correlationId: req.correlationId
    });
    
    return res.status(403).json({
      error: "Forbidden",
      message: "Invalid admin token"
    });
  }
  
  // Log emergency shutdown
  auditLogger.logEmergency({
    action: "kill-switch",
    reason: reason || "Manual emergency shutdown",
    triggeredBy: "admin",
    ip: req.ip,
    correlationId: req.correlationId
  });
  
  logger.warn({
    reason,
    correlationId: req.correlationId
  }, "🚨 EMERGENCY SHUTDOWN INITIATED");
  
  try {
    // Stop all running agents
    const allStates = agentStateService.getAllAgentsStatus();
    const runningAgents = Object.keys(allStates).filter(
      agentId => allStates[agentId].status === "running"
    );
    
    runningAgents.forEach(agentId => {
      try {
        agentStateService.stopAgent(agentId);
        auditLogger.logAgentOperation({
          action: "emergency_stop",
          agentId,
          success: true,
          user: "admin",
          ip: req.ip,
          reason: "Emergency shutdown",
          correlationId: req.correlationId
        });
      } catch (error) {
        logger.error({ agentId, error: error.message }, "Failed to stop agent during emergency");
      }
    });
    
    res.json({
      success: true,
      message: "Emergency shutdown initiated",
      agentsStopped: runningAgents.length,
      agents: runningAgents,
      timestamp: new Date().toISOString()
    });
    
    // Schedule graceful shutdown (give 5 seconds to finish requests)
    setTimeout(() => {
      logger.fatal("Performing graceful shutdown after emergency kill-switch");
      process.exit(0);
    }, 5000);
    
  } catch (error) {
    logger.error({ error: error.message }, "Emergency shutdown failed");
    
    res.status(500).json({
      error: "Shutdown Failed",
      message: error.message
    });
  }
});

/**
 * GET /api/emergency/status
 * Check emergency system status
 */
router.get("/status", (req, res) => {
  const allStates = agentStateService.getAllAgentsStatus();
  const runningAgents = Object.keys(allStates).filter(
    agentId => allStates[agentId].status === "running"
  );
  
  res.json({
    emergencySystemReady: true,
    runningAgents: runningAgents.length,
    safeMode: env.safeMode,
    timestamp: new Date().toISOString()
  });
});

export default router;
