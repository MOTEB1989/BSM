import logger from "../utils/logger.js";
import { auditLogger } from "../utils/auditLogger.js";
import { env } from "../config/env.js";
import EventEmitter from "events";

/**
 * Team Notification Service
 * Central hub for broadcasting notifications to all agents and team members
 * Supports multiple channels: in-memory, Telegram, webhooks
 */

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.notifications = [];
    this.maxNotifications = 1000; // Keep last 1000 notifications
    this.subscribers = new Map(); // Agent subscriptions
    this.channels = new Set(["internal", "audit", "telegram"]);
  }

  /**
   * Subscribe an agent to notifications
   * @param {string} agentId - Agent ID
   * @param {Object} options - Subscription options
   */
  subscribe(agentId, options = {}) {
    const subscription = {
      agentId,
      subscribedAt: new Date().toISOString(),
      filters: options.filters || [], // Event type filters
      priority: options.priority || "normal", // high, normal, low
      channels: options.channels || ["internal"]
    };

    this.subscribers.set(agentId, subscription);

    logger.info({
      agentId,
      filters: subscription.filters,
      priority: subscription.priority
    }, "Agent subscribed to notifications");

    // Audit subscription
    auditLogger.logAgentOperation({
      action: "notification_subscribe",
      agentId,
      success: true,
      user: "system"
    });

    return subscription;
  }

  /**
   * Unsubscribe an agent from notifications
   * @param {string} agentId - Agent ID
   */
  unsubscribe(agentId) {
    const existed = this.subscribers.delete(agentId);

    if (existed) {
      logger.info({ agentId }, "Agent unsubscribed from notifications");
      
      auditLogger.logAgentOperation({
        action: "notification_unsubscribe",
        agentId,
        success: true,
        user: "system"
      });
    }

    return existed;
  }

  /**
   * Broadcast notification to all subscribed agents
   * @param {Object} notification - Notification object
   */
  async broadcast(notification) {
    const enrichedNotification = {
      id: this._generateId(),
      timestamp: new Date().toISOString(),
      ...notification,
      broadcasted: true
    };

    // Store notification
    this.notifications.push(enrichedNotification);
    if (this.notifications.length > this.maxNotifications) {
      this.notifications.shift(); // Remove oldest
    }

    // Emit event for real-time subscribers
    this.emit("notification", enrichedNotification);

    // Log broadcast
    logger.info({
      notificationId: enrichedNotification.id,
      type: notification.type,
      priority: notification.priority,
      subscriberCount: this.subscribers.size
    }, "Broadcasting notification to all agents");

    // Audit
    auditLogger.writeDeferred({
      event: "notification",
      action: "broadcast",
      type: notification.type,
      priority: notification.priority,
      message: notification.message,
      subscriberCount: this.subscribers.size
    });

    // Notify each subscriber
    const notificationPromises = [];
    for (const [agentId, subscription] of this.subscribers.entries()) {
      // Check filters
      if (subscription.filters.length > 0 && 
          !subscription.filters.includes(notification.type)) {
        continue;
      }

      // Check priority
      if (subscription.priority === "high" && 
          notification.priority === "low") {
        continue;
      }

      notificationPromises.push(
        this._notifyAgent(agentId, enrichedNotification, subscription)
      );
    }

    await Promise.allSettled(notificationPromises);

    return enrichedNotification;
  }

  /**
   * Send urgent notification (highest priority)
   * @param {string} message - Urgent message
   * @param {Object} details - Additional details
   */
  async urgent(message, details = {}) {
    return this.broadcast({
      type: "urgent",
      priority: "critical",
      message,
      details,
      requiresAcknowledgment: true
    });
  }

  /**
   * Send security alert to all agents
   * @param {string} threat - Threat description
   * @param {Object} details - Threat details
   */
  async securityAlert(threat, details = {}) {
    const notification = {
      type: "security",
      priority: "critical",
      message: `🛡️ SECURITY ALERT: ${threat}`,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        actionRequired: true
      },
      requiresAcknowledgment: true
    };

    logger.warn({
      threat,
      details
    }, "Security alert broadcasted");

    auditLogger.logSecurityEvent({
      severity: "critical",
      action: "security_alert_broadcast",
      details: { threat, ...details },
      user: "system"
    });

    return this.broadcast(notification);
  }

  /**
   * Notify about repository changes
   * @param {string} changeType - Type of change (update, pr, commit, etc.)
   * @param {Object} details - Change details
   */
  async repositoryChange(changeType, details = {}) {
    return this.broadcast({
      type: "repository_change",
      priority: "normal",
      message: `📝 Repository ${changeType}: ${details.description || "New changes detected"}`,
      details: {
        changeType,
        ...details
      }
    });
  }

  /**
   * Notify about integration issues
   * @param {string} integration - Integration name
   * @param {Object} error - Error details
   */
  async integrationIssue(integration, error = {}) {
    return this.broadcast({
      type: "integration_issue",
      priority: "high",
      message: `⚠️ Integration Issue: ${integration}`,
      details: {
        integration,
        error: error.message || error,
        needsCoordination: true
      }
    });
  }

  /**
   * Request approval from user before action
   * @param {string} action - Action description
   * @param {Object} details - Action details
   */
  async requestApproval(action, details = {}) {
    const notification = {
      type: "approval_request",
      priority: "high",
      message: `✋ Approval Required: ${action}`,
      details: {
        action,
        ...details,
        status: "pending",
        approvalUrl: details.approvalUrl || null
      },
      requiresResponse: true
    };

    logger.info({
      action,
      details
    }, "Approval request broadcasted");

    return this.broadcast(notification);
  }

  /**
   * Get recent notifications
   * @param {Object} options - Query options
   */
  getNotifications(options = {}) {
    const {
      limit = 50,
      type = null,
      priority = null,
      since = null
    } = options;

    let filtered = [...this.notifications];

    if (type) {
      filtered = filtered.filter(n => n.type === type);
    }

    if (priority) {
      filtered = filtered.filter(n => n.priority === priority);
    }

    if (since) {
      const sinceDate = new Date(since);
      filtered = filtered.filter(n => new Date(n.timestamp) > sinceDate);
    }

    // Sort by timestamp descending (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return filtered.slice(0, limit);
  }

  /**
   * Get subscriber list
   */
  getSubscribers() {
    return Array.from(this.subscribers.entries()).map(([agentId, sub]) => ({
      agentId,
      ...sub
    }));
  }

  /**
   * Clear old notifications
   * @param {number} olderThanHours - Clear notifications older than N hours
   */
  clearOldNotifications(olderThanHours = 24) {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    const originalLength = this.notifications.length;

    this.notifications = this.notifications.filter(n => 
      new Date(n.timestamp).getTime() > cutoffTime
    );

    const removed = originalLength - this.notifications.length;

    if (removed > 0) {
      logger.info({
        removed,
        remaining: this.notifications.length
      }, "Cleared old notifications");
    }

    return removed;
  }

  /**
   * Get notification statistics
   */
  getStats() {
    const typeCount = {};
    const priorityCount = {};

    this.notifications.forEach(n => {
      typeCount[n.type] = (typeCount[n.type] || 0) + 1;
      priorityCount[n.priority] = (priorityCount[n.priority] || 0) + 1;
    });

    return {
      totalNotifications: this.notifications.length,
      totalSubscribers: this.subscribers.size,
      byType: typeCount,
      byPriority: priorityCount,
      oldestNotification: this.notifications.length > 0 
        ? this.notifications[0].timestamp 
        : null,
      newestNotification: this.notifications.length > 0 
        ? this.notifications[this.notifications.length - 1].timestamp 
        : null
    };
  }

  /**
   * Private: Notify individual agent
   */
  async _notifyAgent(agentId, notification, subscription) {
    try {
      // Emit agent-specific event
      this.emit(`notification:${agentId}`, notification);

      logger.debug({
        agentId,
        notificationId: notification.id,
        type: notification.type
      }, "Agent notified");

      return { agentId, success: true };
    } catch (error) {
      logger.error({
        agentId,
        notificationId: notification.id,
        error: error.message
      }, "Failed to notify agent");

      return { agentId, success: false, error: error.message };
    }
  }

  /**
   * Private: Generate unique notification ID
   */
  _generateId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
