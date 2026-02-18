import { appendFile, mkdir, access } from "fs/promises";
import { createReadStream } from "fs";
import { createInterface } from "readline";
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
  async ensureLogDirectory() {
    try {
      await access(this.logDir);
    } catch {
      await mkdir(this.logDir, { recursive: true, mode: 0o755 });
      logger.info({ logDir: this.logDir }, "Created audit log directory");
    }
  }

  /**
   * Write audit entry (append-only) - async version
   * @param {Object} entry - Audit entry to log
   */
  async write(entry) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      ...entry
    };

    // Append to audit log (JSONL format - one JSON object per line)
    const logLine = JSON.stringify(auditEntry) + "\n";
    
    try {
      await appendFile(this.auditLogPath, logLine, {
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
   * Write audit entry (fire-and-forget async)
   * For backwards compatibility where sync write was expected but we want async I/O
   * @param {Object} entry - Audit entry to log
   */
  writeDeferred(entry) {
    // Fire and forget async write
    this.write(entry).catch(err => {
      logger.error({ error: err.message }, "Failed async audit write");
    });
  }

  /**
   * Log authentication attempt
   */
  logAuth(data) {
    this.writeDeferred({
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
    this.writeDeferred({
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
    this.writeDeferred({
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
    this.writeDeferred({
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
    this.writeDeferred({
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
    this.writeDeferred({
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
   * Read audit logs using streaming (efficient for large files)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Audit entries
   */
  async readLogs(options = {}) {
    const { limit = 100, offset = 0, event = null } = options;

    try {
      await access(this.auditLogPath);
    } catch {
      return [];
    }

    const entries = [];
    let lineCount = 0;
    let skipped = 0;

    const fileStream = createReadStream(this.auditLogPath);
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line);
        
        // Filter by event type if specified
        if (event && entry.event !== event) {
          continue;
        }

        // Skip offset entries
        if (skipped < offset) {
          skipped++;
          continue;
        }

        // Add to results
        entries.push(entry);
        lineCount++;

        // Stop when limit reached
        if (lineCount >= limit) {
          break;
        }
      } catch {
        // Skip invalid lines
      }
    }

    return entries;
  }

  /**
   * Get audit log statistics using streaming
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    try {
      await access(this.auditLogPath);
    } catch {
      return { totalEntries: 0, events: {} };
    }

    const events = {};
    let totalEntries = 0;

    const fileStream = createReadStream(this.auditLogPath);
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line);
        events[entry.event] = (events[entry.event] || 0) + 1;
        totalEntries++;
      } catch {
        // Skip invalid lines
      }
    }

    return {
      totalEntries,
      events,
      logPath: this.auditLogPath
    };
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
