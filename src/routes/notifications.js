import { Router } from "express";
import { notificationService } from "../services/notificationService.js";
import { agentCoordinationService } from "../services/agentCoordinationService.js";
import { securityShieldService } from "../services/securityShieldService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { auth } from "../middleware/auth.js";
import { auditLogger } from "../utils/auditLogger.js";
import logger from "../utils/logger.js";

const router = Router();

/**
 * GET /api/notifications - Get recent notifications
 */
router.get("/", asyncHandler(async (req, res) => {
  const { limit, type, priority, since } = req.query;

  const notifications = notificationService.getNotifications({
    limit: limit ? parseInt(limit) : 50,
    type,
    priority,
    since
  });

  res.json({
    success: true,
    count: notifications.length,
    notifications
  });
}));

/**
 * GET /api/notifications/stats - Get notification statistics
 */
router.get("/stats", asyncHandler(async (req, res) => {
  const stats = notificationService.getStats();
  res.json({
    success: true,
    stats
  });
}));

/**
 * GET /api/notifications/subscribers - Get list of subscribers
 */
router.get("/subscribers", asyncHandler(async (req, res) => {
  const subscribers = notificationService.getSubscribers();
  res.json({
    success: true,
    count: subscribers.length,
    subscribers
  });
}));

/**
 * POST /api/notifications/subscribe - Subscribe an agent to notifications
 */
router.post("/subscribe", asyncHandler(async (req, res) => {
  const { agentId, filters, priority, channels } = req.body;

  if (!agentId) {
    return res.status(400).json({
      success: false,
      error: "agentId is required"
    });
  }

  const subscription = notificationService.subscribe(agentId, {
    filters,
    priority,
    channels
  });

  res.json({
    success: true,
    subscription
  });
}));

/**
 * POST /api/notifications/unsubscribe - Unsubscribe an agent
 */
router.post("/unsubscribe", asyncHandler(async (req, res) => {
  const { agentId } = req.body;

  if (!agentId) {
    return res.status(400).json({
      success: false,
      error: "agentId is required"
    });
  }

  const unsubscribed = notificationService.unsubscribe(agentId);

  res.json({
    success: true,
    unsubscribed
  });
}));

/**
 * POST /api/notifications/broadcast - Broadcast a notification (admin only)
 */
router.post("/broadcast", auth, asyncHandler(async (req, res) => {
  const { type, priority, message, details } = req.body;

  if (!type || !message) {
    return res.status(400).json({
      success: false,
      error: "type and message are required"
    });
  }

  const notification = await notificationService.broadcast({
    type,
    priority: priority || "normal",
    message,
    details
  });

  auditLogger.writeDeferred({
    event: "notification",
    action: "manual_broadcast",
    user: req.isAdmin ? "admin" : "system",
    type,
    priority,
    correlationId: req.correlationId
  });

  res.json({
    success: true,
    notification
  });
}));

/**
 * GET /api/notifications/coordination - Get active collaborations
 */
router.get("/coordination", asyncHandler(async (req, res) => {
  const collaborations = agentCoordinationService.getActiveCollaborations();

  res.json({
    success: true,
    count: collaborations.length,
    collaborations
  });
}));

/**
 * GET /api/notifications/coordination/:sessionId - Get collaboration details
 */
router.get("/coordination/:sessionId", asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const collaboration = agentCoordinationService.getCollaboration(sessionId);

  if (!collaboration) {
    return res.status(404).json({
      success: false,
      error: "Collaboration session not found"
    });
  }

  res.json({
    success: true,
    collaboration
  });
}));

/**
 * POST /api/notifications/coordination/start - Start collaboration session
 */
router.post("/coordination/start", asyncHandler(async (req, res) => {
  const { initiator, task, requiredAgents, priority, approvalRequired, userContext } = req.body;

  if (!initiator || !task) {
    return res.status(400).json({
      success: false,
      error: "initiator and task are required"
    });
  }

  const session = await agentCoordinationService.startCollaboration({
    initiator,
    task,
    requiredAgents,
    priority,
    approvalRequired,
    userContext
  });

  res.json({
    success: true,
    session
  });
}));

/**
 * POST /api/notifications/coordination/:sessionId/approve - Approve collaboration (admin only)
 */
router.post("/coordination/:sessionId/approve", auth, asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const approver = req.isAdmin ? "admin" : "system";

  const session = await agentCoordinationService.approveCollaboration(sessionId, approver);

  res.json({
    success: true,
    session
  });
}));

/**
 * POST /api/notifications/coordination/:sessionId/join - Join collaboration
 */
router.post("/coordination/:sessionId/join", asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { agentId } = req.body;

  if (!agentId) {
    return res.status(400).json({
      success: false,
      error: "agentId is required"
    });
  }

  const session = await agentCoordinationService.joinCollaboration(sessionId, agentId);

  res.json({
    success: true,
    session
  });
}));

/**
 * POST /api/notifications/coordination/:sessionId/message - Send message in collaboration
 */
router.post("/coordination/:sessionId/message", asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { agentId, message, metadata } = req.body;

  if (!agentId || !message) {
    return res.status(400).json({
      success: false,
      error: "agentId and message are required"
    });
  }

  const msg = await agentCoordinationService.sendMessage(sessionId, agentId, message, metadata);

  res.json({
    success: true,
    message: msg
  });
}));

/**
 * POST /api/notifications/coordination/:sessionId/complete - Complete collaboration
 */
router.post("/coordination/:sessionId/complete", asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { result } = req.body;

  const session = await agentCoordinationService.completeCollaboration(sessionId, result);

  res.json({
    success: true,
    session
  });
}));

/**
 * POST /api/notifications/coordination/:sessionId/cancel - Cancel collaboration
 */
router.post("/coordination/:sessionId/cancel", asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { reason } = req.body;

  const session = await agentCoordinationService.cancelCollaboration(sessionId, reason);

  res.json({
    success: true,
    session
  });
}));

/**
 * GET /api/notifications/coordination/history - Get coordination history
 */
router.get("/coordination/history", asyncHandler(async (req, res) => {
  const { limit, initiator } = req.query;

  const history = agentCoordinationService.getHistory({
    limit: limit ? parseInt(limit) : 10,
    initiator
  });

  res.json({
    success: true,
    count: history.length,
    history
  });
}));

/**
 * GET /api/notifications/security/status - Get security shield status
 */
router.get("/security/status", asyncHandler(async (req, res) => {
  const status = await securityShieldService.checkSecurityStatus();

  res.json({
    success: true,
    status
  });
}));

/**
 * GET /api/notifications/security/stats - Get security statistics
 */
router.get("/security/stats", asyncHandler(async (req, res) => {
  const stats = securityShieldService.getStats();

  res.json({
    success: true,
    stats
  });
}));

/**
 * GET /api/notifications/security/threats - Get threat history
 */
router.get("/security/threats", asyncHandler(async (req, res) => {
  const { limit, severity, type } = req.query;

  const threats = securityShieldService.getThreatHistory({
    limit: limit ? parseInt(limit) : 20,
    severity,
    type
  });

  res.json({
    success: true,
    count: threats.length,
    threats
  });
}));

/**
 * GET /api/notifications/security/activations - Get shield activation history
 */
router.get("/security/activations", asyncHandler(async (req, res) => {
  const activations = securityShieldService.getActivationHistory();

  res.json({
    success: true,
    count: activations.length,
    activations
  });
}));

/**
 * POST /api/notifications/security/report-vulnerability - Report security vulnerability
 */
router.post("/security/report-vulnerability", asyncHandler(async (req, res) => {
  const vulnerability = req.body;

  if (!vulnerability.description) {
    return res.status(400).json({
      success: false,
      error: "vulnerability description is required"
    });
  }

  const threat = await securityShieldService.reportVulnerability(vulnerability);

  res.json({
    success: true,
    threat
  });
}));

/**
 * POST /api/notifications/security/activate-shield - Manually activate shield (admin only)
 */
router.post("/security/activate-shield", auth, asyncHandler(async (req, res) => {
  const threat = req.body;

  if (!threat.description) {
    return res.status(400).json({
      success: false,
      error: "threat description is required"
    });
  }

  const activation = await securityShieldService.activateShield(threat);

  logger.warn({
    activationId: activation.activationId,
    user: req.isAdmin ? "admin" : "system"
  }, "Manual shield activation");

  res.json({
    success: true,
    activation
  });
}));

/**
 * POST /api/notifications/security/deactivate-shield - Deactivate shield (admin only)
 */
router.post("/security/deactivate-shield", auth, asyncHandler(async (req, res) => {
  const { activationId, resolution } = req.body;

  if (!activationId) {
    return res.status(400).json({
      success: false,
      error: "activationId is required"
    });
  }

  const activation = await securityShieldService.deactivateShield(activationId, resolution);

  res.json({
    success: true,
    activation
  });
}));

export default router;
