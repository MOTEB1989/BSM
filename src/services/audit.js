import { writeFile, appendFile } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { AppError } from "../utils/errors.js";
import logger from "../utils/logger.js";

const AUDIT_DIR = path.join(process.cwd(), "data", "audit");
const AUDIT_LOG_PATH = path.join(AUDIT_DIR, "audit.log");
const CRITICAL_AGENT_IDS = new Set(["my-agent"]);

// Audit queue for batching writes
const auditQueue = [];
let flushTimer = null;
const FLUSH_INTERVAL = 1000; // Flush every 1 second
const MAX_QUEUE_SIZE = 100; // Flush immediately if queue exceeds this
const MAX_RETRY_ATTEMPTS = 3;
let retryCount = 0;

const ensureAuditDir = () => {
  if (!existsSync(AUDIT_DIR)) {
    mkdirSync(AUDIT_DIR, { recursive: true });
  }
};

// Async batch flush of audit entries with retry
const flushAuditQueue = async () => {
  if (auditQueue.length === 0) return;

  const entries = auditQueue.splice(0, auditQueue.length);
  const content = entries.map(e => JSON.stringify(e)).join('\n') + '\n';

  try {
    await appendFile(AUDIT_LOG_PATH, content, "utf8");
    retryCount = 0; // Reset retry count on success
  } catch (err) {
    // Instead of sync fallback, prepend entries back to queue for retry
    logger.error({ error: err.message, retryCount }, "Audit write failed, requeuing entries");
    auditQueue.unshift(...entries);
    
    // Retry with exponential backoff
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      retryCount++;
      const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 10000);
      setTimeout(() => {
        flushAuditQueue().catch(retryErr => {
          logger.error({ error: retryErr.message }, "Audit retry failed");
        });
      }, backoffMs);
    } else {
      logger.error("Max audit retry attempts reached, entries may be lost");
      retryCount = 0;
    }
  }

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
};

const sanitizeText = (value, fallback = "unknown") => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return normalized.length ? normalized.slice(0, 200) : fallback;
};

export const isCriticalAgent = (agentId) => CRITICAL_AGENT_IDS.has(agentId);

export const assertAgentDeletionAllowed = ({ agentId, actor }) => {
  if (!agentId || typeof agentId !== "string") {
    throw new AppError("agentId is required", 400, "AUDIT_INVALID_AGENT_ID");
  }

  if (isCriticalAgent(agentId)) {
    recordAuditEvent({
      action: "agent.delete.blocked",
      actor,
      resourceType: "agent",
      resourceId: agentId,
      outcome: "denied",
      reason: "critical-agent-protection"
    });

    throw new AppError(
      `Deletion blocked for critical agent: ${agentId}`,
      403,
      "CRITICAL_AGENT_DELETE_BLOCKED"
    );
  }
};

export const recordAuditEvent = ({
  action,
  actor,
  resourceType,
  resourceId,
  outcome = "success",
  reason
}) => {
  ensureAuditDir();

  const entry = {
    timestamp: new Date().toISOString(),
    action: sanitizeText(action, "unknown_action"),
    actor: sanitizeText(actor, "system"),
    resourceType: sanitizeText(resourceType, "unknown"),
    resourceId: sanitizeText(resourceId, "unknown"),
    outcome: sanitizeText(outcome, "unknown"),
    reason: sanitizeText(reason, "n/a")
  };

  // Add to queue for batch write
  auditQueue.push(entry);

  // Flush immediately if queue is too large
  if (auditQueue.length >= MAX_QUEUE_SIZE) {
    flushAuditQueue().catch(err => {
      console.error("Failed to flush audit queue:", err);
    });
  } else if (!flushTimer) {
    // Schedule batch flush
    flushTimer = setTimeout(() => {
      flushAuditQueue().catch(err => {
        console.error("Failed to flush audit queue:", err);
      });
    }, FLUSH_INTERVAL);
  }

  return entry;
};

// Ensure queue is flushed on process exit
// Note: SIGTERM/SIGINT handlers for graceful shutdown
const gracefulShutdown = async () => {
  if (auditQueue.length > 0) {
    try {
      await flushAuditQueue();
      logger.info("Audit queue flushed on shutdown");
    } catch (err) {
      logger.error({ error: err.message }, "Failed to flush audit queue on shutdown");
    }
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export const getAuditLogPath = () => AUDIT_LOG_PATH;
