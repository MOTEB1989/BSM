import fs from "fs";
import { writeFile, appendFile } from "fs/promises";
import path from "path";
import { AppError } from "../utils/errors.js";

const AUDIT_DIR = path.join(process.cwd(), "data", "audit");
const AUDIT_LOG_PATH = path.join(AUDIT_DIR, "audit.log");
const CRITICAL_AGENT_IDS = new Set(["my-agent"]);

// Audit queue for batching writes
const auditQueue = [];
let flushTimer = null;
const FLUSH_INTERVAL = 1000; // Flush every 1 second
const MAX_QUEUE_SIZE = 100; // Flush immediately if queue exceeds this

const ensureAuditDir = () => {
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }
};

// Async batch flush of audit entries
const flushAuditQueue = async () => {
  if (auditQueue.length === 0) return;

  const entries = auditQueue.splice(0, auditQueue.length);
  const content = entries.map(e => JSON.stringify(e)).join('\n') + '\n';

  try {
    await appendFile(AUDIT_LOG_PATH, content, "utf8");
  } catch (err) {
    // Fallback to sync write on error to ensure audit integrity
    console.error("Async audit write failed, using sync fallback:", err.message);
    fs.appendFileSync(AUDIT_LOG_PATH, content, "utf8");
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
process.on('beforeExit', () => {
  if (auditQueue.length > 0) {
    const content = auditQueue.map(e => JSON.stringify(e)).join('\n') + '\n';
    fs.appendFileSync(AUDIT_LOG_PATH, content, "utf8");
  }
});

export const getAuditLogPath = () => AUDIT_LOG_PATH;
