import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import YAML from "yaml";
import logger from "./logger.js";

/**
 * Registry validation service
 * Enforces governance, risk management, and operational controls
 * This is a hard gate - server will not start if registry is invalid
 */

const validCategories = ["conversational", "infra", "system", "security", "audit"];
const validContexts = ["chat", "api", "github", "ci", "system", "security", "mobile"];
const validRiskLevels = ["low", "medium", "high", "critical"];
const validApprovalTypes = ["none", "manual", "automated"];
const validProfiles = ["development", "staging", "production"];

export class RegistryValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "RegistryValidationError";
  }
}

/**
 * Validates the agents registry at startup
 * @throws {RegistryValidationError} if validation fails
 */
export const validateRegistry = async () => {
  const registryPath = path.join(process.cwd(), "agents", "registry.yaml");
  
  if (!fsSync.existsSync(registryPath)) {
    logger.warn("No registry.yaml found - skipping registry validation");
    return;
  }

  logger.info("Validating agents registry (hard gate)...");

  const registryContent = await fs.readFile(registryPath, "utf8");
  const registry = YAML.parse(registryContent);

  if (!registry || !registry.agents || !Array.isArray(registry.agents)) {
    throw new RegistryValidationError("Registry must contain an 'agents' array");
  }

  if (registry.agents.length === 0) {
    throw new RegistryValidationError("Registry must contain at least one agent");
  }

  const seenIds = new Set();

  registry.agents.forEach((agent, index) => {
    const agentRef = `agents[${index}] (${agent.id || "unknown"})`;

    // Required fields
    if (!agent.id) throw new RegistryValidationError(`${agentRef}: Missing 'id' field`);
    if (!agent.name) throw new RegistryValidationError(`${agentRef}: Missing 'name' field`);
    if (!agent.category) throw new RegistryValidationError(`${agentRef}: Missing 'category' field`);
    if (!agent.contexts) throw new RegistryValidationError(`${agentRef}: Missing 'contexts' field`);
    if (!agent.expose) throw new RegistryValidationError(`${agentRef}: Missing 'expose' field`);
    if (!agent.risk) throw new RegistryValidationError(`${agentRef}: Missing 'risk' field`);
    if (!agent.approval) throw new RegistryValidationError(`${agentRef}: Missing 'approval' field`);
    if (!agent.startup) throw new RegistryValidationError(`${agentRef}: Missing 'startup' field`);
    if (!agent.healthcheck) throw new RegistryValidationError(`${agentRef}: Missing 'healthcheck' field`);

    // ID validation
    if (!/^[a-z0-9-]+$/.test(agent.id)) {
      throw new RegistryValidationError(`${agentRef}: ID must be lowercase alphanumeric with hyphens`);
    }
    if (seenIds.has(agent.id)) {
      throw new RegistryValidationError(`${agentRef}: Duplicate agent ID`);
    }
    seenIds.add(agent.id);

    // Category validation
    if (!validCategories.includes(agent.category)) {
      throw new RegistryValidationError(`${agentRef}: Invalid category '${agent.category}'`);
    }

    // Contexts validation
    if (!agent.contexts.allowed || !Array.isArray(agent.contexts.allowed)) {
      throw new RegistryValidationError(`${agentRef}: contexts.allowed must be an array`);
    }
    if (agent.contexts.allowed.length === 0) {
      throw new RegistryValidationError(`${agentRef}: contexts.allowed must not be empty`);
    }
    agent.contexts.allowed.forEach((ctx) => {
      if (!validContexts.includes(ctx)) {
        throw new RegistryValidationError(`${agentRef}: Invalid context '${ctx}'`);
      }
    });

    // Risk validation
    if (!validRiskLevels.includes(agent.risk.level)) {
      throw new RegistryValidationError(`${agentRef}: Invalid risk level '${agent.risk.level}'`);
    }
    if (!agent.risk.rationale || agent.risk.rationale.length < 10) {
      throw new RegistryValidationError(`${agentRef}: risk.rationale must be at least 10 characters`);
    }

    // Approval validation
    if (typeof agent.approval.required !== "boolean") {
      throw new RegistryValidationError(`${agentRef}: approval.required must be boolean`);
    }
    if (!validApprovalTypes.includes(agent.approval.type)) {
      throw new RegistryValidationError(`${agentRef}: Invalid approval type '${agent.approval.type}'`);
    }
    if (!Array.isArray(agent.approval.approvers)) {
      throw new RegistryValidationError(`${agentRef}: approval.approvers must be an array`);
    }

    // Startup validation - CRITICAL SECURITY REQUIREMENT
    if (typeof agent.startup.auto_start !== "boolean") {
      throw new RegistryValidationError(`${agentRef}: startup.auto_start must be boolean`);
    }
    if (agent.startup.auto_start !== false) {
      throw new RegistryValidationError(`${agentRef}: startup.auto_start must be false (security requirement)`);
    }
    if (!Array.isArray(agent.startup.allowed_profiles) || agent.startup.allowed_profiles.length === 0) {
      throw new RegistryValidationError(`${agentRef}: startup.allowed_profiles must be a non-empty array`);
    }
    agent.startup.allowed_profiles.forEach((profile) => {
      if (!validProfiles.includes(profile)) {
        throw new RegistryValidationError(`${agentRef}: Invalid profile '${profile}'`);
      }
    });

    // Healthcheck validation
    const expectedEndpoint = `/api/agents/${agent.id}/health`;
    if (agent.healthcheck.endpoint !== expectedEndpoint) {
      throw new RegistryValidationError(
        `${agentRef}: healthcheck.endpoint must be '${expectedEndpoint}'`
      );
    }
    if (typeof agent.healthcheck.interval_seconds !== "number") {
      throw new RegistryValidationError(`${agentRef}: healthcheck.interval_seconds must be a number`);
    }
    if (agent.healthcheck.interval_seconds < 30 || agent.healthcheck.interval_seconds > 300) {
      throw new RegistryValidationError(`${agentRef}: healthcheck.interval_seconds must be between 30 and 300`);
    }
  });

  logger.info({
    agentCount: registry.agents.length,
    agents: Array.from(seenIds)
  }, "✅ Registry validation passed (governance enforced)");

  return registry;
};
