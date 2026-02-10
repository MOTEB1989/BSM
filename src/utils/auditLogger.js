import fs from "fs";
import path from "path";
import logger from "./logger.js";

/**
 * Audit Logger
 * Implements append-only audit logging for security-critical operations
 * Logs are written to logs/audit.log in JSONL format (JSON Lines)
 */

class AuditLogger {
  constructor() {
    this.logDir = path.join(process.cwd(), "logs");
    this.auditLogPath = path.join(this.logDir, "audit.log");
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true, mode: 0o755 });
      logger.info({ logDir: this.logDir }, "Created audit log directory");
    }
  }

  /**
   * Write audit entry (append-only)
   * @param {Object} entry - Audit entry to log
   */
  write(entry) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      ...entry
    };

    // Append to audit log (JSONL format - one JSON object per line)
    const logLine = JSON.stringify(auditEntry) + "\n";
    
    try {
      fs.appendFileSync(this.auditLogPath, logLine, {
        mode: 0o600, // Read/write for owner only
        flag: "a" // Append mode
      });
    } catch (error) {
      // Log to standard logger if audit log fails (critical error)
      logger.error({
        error: error.message,
        auditEntry
      }, "Failed to write to audit log");
    }
  }

  /**
   * Log authentication attempt
   */
  logAuth(data) {
    this.write({
      event: "auth",
      action: data.action || "login",
      success: data.success,
      user: data.user,
      ip: data.ip,
      reason: data.reason,
      correlationId: data.correlationId
    });
  }

  /**
   * Log agent operation
   */
  logAgentOperation(data) {
    this.write({
      event: "agent",
      action: data.action, // start, stop, execute
      agentId: data.agentId,
      success: data.success,
      user: data.user || "system",
      ip: data.ip,
      reason: data.reason,
      correlationId: data.correlationId
    });
  }

  /**
   * Log configuration change
   */
  logConfigChange(data) {
    this.write({
      event: "config",
      action: data.action, // modify, update, delete
      resource: data.resource,
      oldValue: data.oldValue,
      newValue: data.newValue,
      user: data.user,
      ip: data.ip,
      correlationId: data.correlationId
    });
  }

  /**
   * Log security event
   */
  logSecurityEvent(data) {
    this.write({
      event: "security",
      severity: data.severity || "medium",
      action: data.action,
      details: data.details,
      ip: data.ip,
      user: data.user,
      correlationId: data.correlationId
    });
  }

  /**
   * Log emergency action
   */
  logEmergency(data) {
    this.write({
      event: "emergency",
      action: data.action, // shutdown, kill-switch
      reason: data.reason,
      triggeredBy: data.triggeredBy,
      ip: data.ip,
      correlationId: data.correlationId
    });
  }

  /**
   * Log access denial
   */
  logAccessDenied(data) {
    this.write({
      event: "access_denied",
      resource: data.resource,
      action: data.action,
      reason: data.reason,
      user: data.user,
      ip: data.ip,
      correlationId: data.correlationId
    });
  }

  /**
   * Read audit logs (with pagination)
   * @param {Object} options - Query options
   * @returns {Array} Audit entries
   */
  readLogs(options = {}) {
    const { limit = 100, offset = 0, event = null } = options;

    if (!fs.existsSync(this.auditLogPath)) {
      return [];
    }

    const content = fs.readFileSync(this.auditLogPath, "utf8");
    const lines = content.trim().split("\n").filter(Boolean);

    let entries = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);

    // Filter by event type if specified
    if (event) {
      entries = entries.filter(e => e.event === event);
    }

    // Apply pagination
    return entries.slice(offset, offset + limit);
  }

  /**
   * Get audit log statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    if (!fs.existsSync(this.auditLogPath)) {
      return { totalEntries: 0, events: {} };
    }

    const content = fs.readFileSync(this.auditLogPath, "utf8");
    const lines = content.trim().split("\n").filter(Boolean);

    const events = {};
    lines.forEach(line => {
      try {
        const entry = JSON.parse(line);
        events[entry.event] = (events[entry.event] || 0) + 1;
      } catch {
        // Skip invalid lines
      }
    });

    return {
      totalEntries: lines.length,
      events,
      logPath: this.auditLogPath
    };
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
