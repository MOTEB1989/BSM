import logger from "../utils/logger.js";
import { auditLogger } from "../utils/auditLogger.js";
import { notificationService } from "./notificationService.js";
import { agentCoordinationService } from "./agentCoordinationService.js";
import { agentStateService } from "./agentStateService.js";
import { env } from "../config/env.js";

/**
 * Security Shield Service
 * Implements comprehensive security protection
 * Activates when security threats are detected
 * Coordinates all agents for security response
 */

class SecurityShieldService {
  constructor() {
    this.shieldActive = false;
    this.threatLevel = "normal"; // normal, elevated, high, critical
    this.detectedThreats = [];
    this.maxThreatHistory = 100;
    this.shieldActivations = [];
  }

  /**
   * Activate comprehensive security shield
   * @param {Object} threat - Threat details
   * @returns {Object} Shield activation result
   */
  async activateShield(threat) {
    if (this.shieldActive) {
      logger.warn("Security shield already active, escalating threat level");
      return this._escalateThreatLevel(threat);
    }

    const activation = {
      activationId: this._generateId(),
      activatedAt: new Date().toISOString(),
      threat,
      threatLevel: this._assessThreatLevel(threat),
      status: "active"
    };

    this.shieldActive = true;
    this.threatLevel = activation.threatLevel;
    this.shieldActivations.push(activation);

    logger.warn({
      activationId: activation.activationId,
      threatLevel: activation.threatLevel,
      threat: threat.description
    }, "🛡️ SECURITY SHIELD ACTIVATED");

    // Record threat
    this._recordThreat(threat);

    // Send critical security alert to all agents
    await notificationService.securityAlert(
      threat.description || "Unknown security threat",
      {
        activationId: activation.activationId,
        threatLevel: activation.threatLevel,
        shieldStatus: "activated",
        immediateActions: this._getImmediateActions(activation.threatLevel)
      }
    );

    // Start coordination session for security response
    const coordinationSession = await agentCoordinationService.startCollaboration({
      initiator: "security-shield",
      task: `Security Response: ${threat.description}`,
      requiredAgents: ["security-agent", "integrity-agent", "governance-agent"],
      priority: "critical",
      approvalRequired: false, // Security threats don't wait for approval
      userContext: {
        activationId: activation.activationId,
        threat,
        threatLevel: activation.threatLevel
      }
    });

    activation.coordinationSessionId = coordinationSession.sessionId;

    // Audit critical event
    auditLogger.logSecurityEvent({
      severity: "critical",
      action: "shield_activated",
      details: {
        activationId: activation.activationId,
        threat,
        threatLevel: activation.threatLevel
      },
      user: "security-shield"
    });

    // Log emergency
    auditLogger.logEmergency({
      action: "shield_activation",
      reason: threat.description,
      triggeredBy: threat.source || "system"
    });

    return activation;
  }

  /**
   * Deactivate security shield
   * @param {string} activationId - Activation ID
   * @param {Object} resolution - Resolution details
   */
  async deactivateShield(activationId, resolution = {}) {
    if (!this.shieldActive) {
      throw new Error("Security shield is not active");
    }

    const activation = this.shieldActivations.find(a => a.activationId === activationId);
    
    if (!activation) {
      throw new Error(`Activation ${activationId} not found`);
    }

    activation.deactivatedAt = new Date().toISOString();
    activation.status = "resolved";
    activation.resolution = resolution;

    this.shieldActive = false;
    this.threatLevel = "normal";

    logger.info({
      activationId,
      duration: this._calculateDuration(activation.activatedAt, activation.deactivatedAt)
    }, "Security shield deactivated");

    // Notify all agents
    await notificationService.broadcast({
      type: "security_shield_deactivated",
      priority: "high",
      message: "🛡️ Security Shield Deactivated - Threat Resolved",
      details: {
        activationId,
        resolution
      }
    });

    // Complete coordination session if exists
    if (activation.coordinationSessionId) {
      try {
        await agentCoordinationService.completeCollaboration(
          activation.coordinationSessionId,
          resolution
        );
      } catch (error) {
        logger.warn({ error: error.message }, "Failed to complete coordination session");
      }
    }

    // Audit
    auditLogger.logSecurityEvent({
      severity: "high",
      action: "shield_deactivated",
      details: {
        activationId,
        resolution
      },
      user: "security-shield"
    });

    return activation;
  }

  /**
   * Report security vulnerability
   * @param {Object} vulnerability - Vulnerability details
   */
  async reportVulnerability(vulnerability) {
    const threat = {
      type: "vulnerability",
      description: vulnerability.description || "Security vulnerability detected",
      severity: vulnerability.severity || "medium",
      source: vulnerability.source || "scan",
      details: vulnerability
    };

    this._recordThreat(threat);

    logger.warn({
      vulnerability: threat.description,
      severity: threat.severity
    }, "Security vulnerability reported");

    // Notify all agents
    await notificationService.securityAlert(
      `Vulnerability: ${threat.description}`,
      {
        vulnerability,
        severity: threat.severity,
        actionRequired: true
      }
    );

    // Activate shield if severity is high or critical
    if (["high", "critical"].includes(threat.severity)) {
      await this.activateShield(threat);
    }

    // Audit
    auditLogger.logSecurityEvent({
      severity: threat.severity,
      action: "vulnerability_reported",
      details: vulnerability,
      user: "security-shield"
    });

    return threat;
  }

  /**
   * Check system security status
   * @returns {Object} Security status
   */
  async checkSecurityStatus() {
    const status = {
      shieldActive: this.shieldActive,
      threatLevel: this.threatLevel,
      recentThreats: this.detectedThreats.slice(-10),
      activeActivations: this.shieldActivations.filter(a => a.status === "active"),
      totalActivations: this.shieldActivations.length,
      systemHealth: await this._assessSystemHealth()
    };

    logger.debug(status, "Security status checked");

    return status;
  }

  /**
   * Get threat history
   * @param {Object} options - Query options
   */
  getThreatHistory(options = {}) {
    const { limit = 20, severity = null, type = null } = options;

    let threats = [...this.detectedThreats];

    if (severity) {
      threats = threats.filter(t => t.severity === severity);
    }

    if (type) {
      threats = threats.filter(t => t.type === type);
    }

    // Sort by timestamp descending
    threats.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return threats.slice(0, limit);
  }

  /**
   * Get shield activation history
   */
  getActivationHistory() {
    return [...this.shieldActivations].reverse(); // Most recent first
  }

  /**
   * Get security statistics
   */
  getStats() {
    const threatsBySeverity = {};
    const threatsByType = {};

    this.detectedThreats.forEach(t => {
      threatsBySeverity[t.severity] = (threatsBySeverity[t.severity] || 0) + 1;
      threatsByType[t.type] = (threatsByType[t.type] || 0) + 1;
    });

    return {
      shieldActive: this.shieldActive,
      currentThreatLevel: this.threatLevel,
      totalThreats: this.detectedThreats.length,
      totalActivations: this.shieldActivations.length,
      activeActivations: this.shieldActivations.filter(a => a.status === "active").length,
      threatsBySeverity,
      threatsByType
    };
  }

  /**
   * Private: Record threat
   */
  _recordThreat(threat) {
    const record = {
      threatId: this._generateId(),
      timestamp: new Date().toISOString(),
      ...threat
    };

    this.detectedThreats.push(record);

    // Limit history size
    if (this.detectedThreats.length > this.maxThreatHistory) {
      this.detectedThreats.shift();
    }

    return record;
  }

  /**
   * Private: Assess threat level
   */
  _assessThreatLevel(threat) {
    if (threat.severity === "critical") return "critical";
    if (threat.severity === "high") return "high";
    if (threat.type === "intrusion") return "critical";
    if (threat.type === "data_breach") return "critical";
    if (threat.type === "vulnerability" && threat.severity === "high") return "high";
    return "elevated";
  }

  /**
   * Private: Escalate threat level
   */
  async _escalateThreatLevel(newThreat) {
    const previousLevel = this.threatLevel;
    const newLevel = this._assessThreatLevel(newThreat);

    if (this._threatLevelValue(newLevel) > this._threatLevelValue(previousLevel)) {
      this.threatLevel = newLevel;

      logger.warn({
        previousLevel,
        newLevel,
        threat: newThreat.description
      }, "Threat level escalated");

      await notificationService.urgent(
        `⚠️ THREAT LEVEL ESCALATED: ${previousLevel} → ${newLevel}`,
        { threat: newThreat }
      );

      auditLogger.logSecurityEvent({
        severity: "critical",
        action: "threat_escalation",
        details: {
          previousLevel,
          newLevel,
          threat: newThreat
        },
        user: "security-shield"
      });
    }

    this._recordThreat(newThreat);

    return {
      escalated: this._threatLevelValue(newLevel) > this._threatLevelValue(previousLevel),
      previousLevel,
      currentLevel: this.threatLevel
    };
  }

  /**
   * Private: Get immediate actions based on threat level
   */
  _getImmediateActions(threatLevel) {
    const actions = {
      critical: [
        "All agents on high alert",
        "External access restricted",
        "Audit all recent activities",
        "Immediate security scan required"
      ],
      high: [
        "Security agents activated",
        "Monitor all operations",
        "Review recent changes"
      ],
      elevated: [
        "Increased monitoring",
        "Review security logs"
      ],
      normal: []
    };

    return actions[threatLevel] || actions.elevated;
  }

  /**
   * Private: Assess system health
   */
  async _assessSystemHealth() {
    // Basic health checks
    const checks = {
      memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal < 0.9,
      safeMode: env.safeMode,
      lanOnly: env.lanOnly,
      uptime: process.uptime() > 0
    };

    const healthy = Object.values(checks).every(v => v === true || v === false);

    return {
      healthy,
      checks
    };
  }

  /**
   * Private: Calculate duration in human-readable format
   */
  _calculateDuration(start, end) {
    const ms = new Date(end) - new Date(start);
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Private: Get numeric value for threat level
   */
  _threatLevelValue(level) {
    const values = {
      normal: 0,
      elevated: 1,
      high: 2,
      critical: 3
    };
    return values[level] || 0;
  }

  /**
   * Private: Generate unique ID
   */
  _generateId() {
    return `shield_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const securityShieldService = new SecurityShieldService();
