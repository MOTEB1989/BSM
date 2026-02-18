import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import logger from "./logger.js";

/**
 * Audit Logger
 * Implements append-only audit logging for security-critical operations
 * Logs are written to logs/audit.log in JSONL format (JSON Lines)
 * 
 * Now uses async operations to avoid blocking the event loop
 */

class AuditLogger {
  constructor() {
    this.logDir = path.join(process.cwd(), "logs");
    this.auditLogPath = path.join(this.logDir, "audit.log");
    this.ensureLogDirectory();
    this.writeQueue = Promise.resolve(); // Queue for sequential writes
  }

  /**
   * Ensure log directory exists (sync - only at startup)
   */
  ensureLogDirectory() {
    if (!fsSync.existsSync(this.logDir)) {
      fsSync.mkdirSync(this.logDir, { recursive: true, mode: 0o755 });
      logger.info({ logDir: this.logDir }, "Created audit log directory");
    }
  }

  /**
   * Write audit entry (append-only, async, queued)
   * @param {Object} entry - Audit entry to log
   */
  write(entry) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      ...entry
    };

    // Append to audit log (JSONL format - one JSON object per line)
    const logLine = JSON.stringify(auditEntry) + "\n";
    
    // Queue write operations to ensure sequential writes
    this.writeQueue = this.writeQueue.then(async () => {
      try {
        await fs.appendFile(this.auditLogPath, logLine, {
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
    }).catch(err => {
      // Catch any queue errors to prevent breaking the chain
      logger.error({ error: err.message }, "Audit log queue error");
    });
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
   * Read audit logs (with pagination, async)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Audit entries
   */
  async readLogs(options = {}) {
    const { limit = 100, offset = 0, event = null } = options;

    try {
      await fs.access(this.auditLogPath);
    } catch {
      return [];
    }

    try {
      const content = await fs.readFile(this.auditLogPath, "utf8");
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
    } catch (error) {
      logger.error({ error: error.message }, "Failed to read audit logs");
      return [];
    }
  }

  /**
   * Get audit log statistics (async)
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    try {
      await fs.access(this.auditLogPath);
    } catch {
      return { totalEntries: 0, events: {} };
    }

    try {
      const content = await fs.readFile(this.auditLogPath, "utf8");
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
    } catch (error) {
      logger.error({ error: error.message }, "Failed to get audit statistics");
      return { totalEntries: 0, events: {}, error: error.message };
    }
  }
      totalEntries: lines.length,
      events,
      logPath: this.auditLogPath
    };
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
