import logger from "../utils/logger.js";
import { auditLogger } from "../utils/auditLogger.js";
import { notificationService } from "./notificationService.js";
import { agentStateService } from "./agentStateService.js";
import { env } from "../config/env.js";

/**
 * Agent Coordination Service
 * Manages collaboration between agents for complex tasks
 * Handles agent-to-agent communication and task distribution
 */

class AgentCoordinationService {
  constructor() {
    this.collaborations = new Map(); // Active collaborations
    this.coordinationHistory = []; // History of coordination sessions
    this.maxHistorySize = 100;
  }

  /**
   * Start a collaboration session
   * @param {Object} options - Collaboration options
   * @returns {Object} Collaboration session
   */
  async startCollaboration(options) {
    const {
      initiator,
      task,
      requiredAgents = [],
      priority = "normal",
      approvalRequired = true,
      userContext = {}
    } = options;

    const sessionId = this._generateSessionId();

    const session = {
      sessionId,
      initiator,
      task,
      requiredAgents,
      priority,
      status: approvalRequired ? "pending_approval" : "active",
      createdAt: new Date().toISOString(),
      participants: new Set([initiator]),
      messages: [],
      approvalRequired,
      userContext
    };

    this.collaborations.set(sessionId, session);

    logger.info({
      sessionId,
      initiator,
      task,
      requiredAgents,
      approvalRequired
    }, "Collaboration session started");

    // Request approval if required
    if (approvalRequired) {
      await notificationService.requestApproval(
        `Agent collaboration: ${task}`,
        {
          sessionId,
          initiator,
          requiredAgents,
          task,
          approvalType: "collaboration"
        }
      );
    }

    // Notify required agents
    await notificationService.broadcast({
      type: "collaboration_request",
      priority,
      message: `🤝 Collaboration Request: ${task}`,
      details: {
        sessionId,
        initiator,
        task,
        requiredAgents,
        status: session.status
      }
    });

    // Audit
    auditLogger.writeDeferred({
      event: "collaboration",
      action: "start_session",
      sessionId,
      initiator,
      task,
      requiredAgents
    });

    return session;
  }

  /**
   * Approve a collaboration session
   * @param {string} sessionId - Session ID
   * @param {string} approver - Approver identifier
   */
  async approveCollaboration(sessionId, approver) {
    const session = this.collaborations.get(sessionId);

    if (!session) {
      throw new Error(`Collaboration session ${sessionId} not found`);
    }

    if (session.status !== "pending_approval") {
      throw new Error(`Session ${sessionId} is not pending approval`);
    }

    session.status = "active";
    session.approvedAt = new Date().toISOString();
    session.approvedBy = approver;

    logger.info({
      sessionId,
      approver
    }, "Collaboration session approved");

    // Notify all agents
    await notificationService.broadcast({
      type: "collaboration_approved",
      priority: "high",
      message: `✅ Collaboration Approved: ${session.task}`,
      details: {
        sessionId,
        approver,
        task: session.task
      }
    });

    // Audit
    auditLogger.writeDeferred({
      event: "collaboration",
      action: "approve_session",
      sessionId,
      approver
    });

    return session;
  }

  /**
   * Add agent to collaboration session
   * @param {string} sessionId - Session ID
   * @param {string} agentId - Agent ID
   */
  async joinCollaboration(sessionId, agentId) {
    const session = this.collaborations.get(sessionId);

    if (!session) {
      throw new Error(`Collaboration session ${sessionId} not found`);
    }

    if (session.status === "completed" || session.status === "cancelled") {
      throw new Error(`Session ${sessionId} is ${session.status}`);
    }

    session.participants.add(agentId);

    logger.info({
      sessionId,
      agentId,
      participantCount: session.participants.size
    }, "Agent joined collaboration");

    // Broadcast join notification
    await notificationService.broadcast({
      type: "agent_joined_collaboration",
      priority: "normal",
      message: `Agent ${agentId} joined collaboration: ${session.task}`,
      details: {
        sessionId,
        agentId,
        participantCount: session.participants.size
      }
    });

    return session;
  }

  /**
   * Send message in collaboration session
   * @param {string} sessionId - Session ID
   * @param {string} agentId - Sender agent ID
   * @param {string} message - Message content
   * @param {Object} metadata - Additional metadata
   */
  async sendMessage(sessionId, agentId, message, metadata = {}) {
    const session = this.collaborations.get(sessionId);

    if (!session) {
      throw new Error(`Collaboration session ${sessionId} not found`);
    }

    if (!session.participants.has(agentId)) {
      throw new Error(`Agent ${agentId} is not a participant in session ${sessionId}`);
    }

    const msg = {
      messageId: this._generateMessageId(),
      timestamp: new Date().toISOString(),
      sender: agentId,
      message,
      metadata
    };

    session.messages.push(msg);

    logger.debug({
      sessionId,
      agentId,
      messageId: msg.messageId
    }, "Message sent in collaboration");

    // Notify other participants
    const otherParticipants = Array.from(session.participants).filter(id => id !== agentId);
    
    for (const participantId of otherParticipants) {
      notificationService.emit(`notification:${participantId}`, {
        type: "collaboration_message",
        sessionId,
        message: msg
      });
    }

    return msg;
  }

  /**
   * Complete a collaboration session
   * @param {string} sessionId - Session ID
   * @param {Object} result - Collaboration result
   */
  async completeCollaboration(sessionId, result = {}) {
    const session = this.collaborations.get(sessionId);

    if (!session) {
      throw new Error(`Collaboration session ${sessionId} not found`);
    }

    session.status = "completed";
    session.completedAt = new Date().toISOString();
    session.result = result;

    logger.info({
      sessionId,
      task: session.task,
      participantCount: session.participants.size,
      messageCount: session.messages.length
    }, "Collaboration session completed");

    // Add to history
    this.coordinationHistory.push({
      ...session,
      participants: Array.from(session.participants)
    });

    if (this.coordinationHistory.length > this.maxHistorySize) {
      this.coordinationHistory.shift();
    }

    // Remove from active collaborations
    this.collaborations.delete(sessionId);

    // Notify all participants
    await notificationService.broadcast({
      type: "collaboration_completed",
      priority: "normal",
      message: `✅ Collaboration Completed: ${session.task}`,
      details: {
        sessionId,
        result
      }
    });

    // Audit
    auditLogger.writeDeferred({
      event: "collaboration",
      action: "complete_session",
      sessionId,
      participantCount: session.participants.size,
      messageCount: session.messages.length
    });

    return session;
  }

  /**
   * Cancel a collaboration session
   * @param {string} sessionId - Session ID
   * @param {string} reason - Cancellation reason
   */
  async cancelCollaboration(sessionId, reason = "User cancelled") {
    const session = this.collaborations.get(sessionId);

    if (!session) {
      throw new Error(`Collaboration session ${sessionId} not found`);
    }

    session.status = "cancelled";
    session.cancelledAt = new Date().toISOString();
    session.cancellationReason = reason;

    logger.info({
      sessionId,
      reason
    }, "Collaboration session cancelled");

    // Remove from active collaborations
    this.collaborations.delete(sessionId);

    // Notify all participants
    await notificationService.broadcast({
      type: "collaboration_cancelled",
      priority: "high",
      message: `❌ Collaboration Cancelled: ${session.task}`,
      details: {
        sessionId,
        reason
      }
    });

    // Audit
    auditLogger.writeDeferred({
      event: "collaboration",
      action: "cancel_session",
      sessionId,
      reason
    });

    return session;
  }

  /**
   * Get collaboration session details
   * @param {string} sessionId - Session ID
   */
  getCollaboration(sessionId) {
    const session = this.collaborations.get(sessionId);
    
    if (!session) {
      return null;
    }

    return {
      ...session,
      participants: Array.from(session.participants)
    };
  }

  /**
   * Get all active collaborations
   */
  getActiveCollaborations() {
    return Array.from(this.collaborations.values()).map(session => ({
      ...session,
      participants: Array.from(session.participants)
    }));
  }

  /**
   * Get collaboration history
   * @param {Object} options - Query options
   */
  getHistory(options = {}) {
    const { limit = 10, initiator = null } = options;

    let history = [...this.coordinationHistory];

    if (initiator) {
      history = history.filter(h => h.initiator === initiator);
    }

    // Sort by completion time descending
    history.sort((a, b) => 
      new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt)
    );

    return history.slice(0, limit);
  }

  /**
   * Coordinate integration fix
   * Special method for handling integration issues
   * @param {string} integration - Integration name
   * @param {Object} error - Error details
   */
  async coordinateIntegrationFix(integration, error, initiator = "system") {
    logger.info({
      integration,
      error: error.message || error
    }, "Coordinating integration fix");

    // Start collaboration for integration fix
    const session = await this.startCollaboration({
      initiator,
      task: `Fix integration issue: ${integration}`,
      requiredAgents: ["integrity-agent", "security-agent"],
      priority: "high",
      approvalRequired: true,
      userContext: {
        integration,
        error: error.message || error
      }
    });

    // Notify about integration issue
    await notificationService.integrationIssue(integration, error);

    return session;
  }

  /**
   * Get coordination statistics
   */
  getStats() {
    return {
      activeCollaborations: this.collaborations.size,
      totalHistorical: this.coordinationHistory.length,
      activeByStatus: this._countByStatus(Array.from(this.collaborations.values())),
      historicalByStatus: this._countByStatus(this.coordinationHistory)
    };
  }

  /**
   * Private: Generate session ID
   */
  _generateSessionId() {
    return `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private: Generate message ID
   */
  _generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private: Count sessions by status
   */
  _countByStatus(sessions) {
    const counts = {};
    sessions.forEach(s => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return counts;
  }
}

// Export singleton instance
export const agentCoordinationService = new AgentCoordinationService();
