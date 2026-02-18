import express from "express";
import { env } from "../config/env.js";
import { isMobileClient } from "../middleware/mobileMode.js";
import logger from "../utils/logger.js";

const router = express.Router();

/**
 * GET /api/status
 * Unified system status endpoint
 * Returns operational mode, feature flags, and system health
 */
router.get("/status", (req, res) => {
  try {
    const isMobile = isMobileClient(req);
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    const status = {
      status: "operational",
      timestamp: new Date().toISOString(),
      environment: env.nodeEnv,
      version: "1.0.0",
      
      // Feature flags (visible to clients)
      features: {
        mobileMode: env.mobileMode,
        lanOnly: env.lanOnly,
        safeMode: env.safeMode
      },
      
      // Client detection
      client: {
        isMobile,
        ip: clientIp,
        restrictions: []
      },
      
      // Service capabilities
      capabilities: {
        chat: true,
        agents: !env.safeMode,
        admin: !env.mobileMode,
        externalApi: !env.safeMode
      }
    };
    
    // Add restriction information for mobile clients
    if (env.mobileMode && isMobile) {
      status.client.restrictions.push("write_operations_disabled");
      status.client.restrictions.push("agent_execution_disabled");
      status.client.restrictions.push("admin_access_disabled");
    }
    
    // Add LAN-only information
    if (env.lanOnly) {
      status.client.restrictions.push("lan_only_access");
    }
    
    logger.debug({
      correlationId: req.correlationId,
      clientIp,
      isMobile
    }, "Status check");
    
    res.json(status);
  } catch (error) {
    logger.error({
      error: error.message,
      correlationId: req.correlationId
    }, "Status endpoint error");
    
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve status"
    });
  }
});

export default router;
