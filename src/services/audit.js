import fs from "fs";
import path from "path";
import { AppError } from "../utils/errors.js";

const AUDIT_DIR = path.join(process.cwd(), "data", "audit");
const AUDIT_LOG_PATH = path.join(AUDIT_DIR, "audit.log");
const CRITICAL_AGENT_IDS = new Set(["my-agent"]);

const ensureAuditDir = () => {
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
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

  fs.appendFileSync(AUDIT_LOG_PATH, `${JSON.stringify(entry)}\n`, "utf8");

  return entry;
};

export const getAuditLogPath = () => AUDIT_LOG_PATH;
