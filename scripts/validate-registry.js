import fs from "fs";
import path from "path";
import YAML from "yaml";

/**
 * Validates the agents registry against the JSON schema
 * This ensures governance, risk management, and operational controls are properly configured
 */

const must = (cond, msg) => {
  if (!cond) throw new Error(`Registry validation failed: ${msg}`);
};

const registryPath = path.join(process.cwd(), "agents", "registry.yaml");
const schemaPath = path.join(process.cwd(), "agents", "registry.schema.json");

// Load and parse files
must(fs.existsSync(registryPath), `Missing registry file: ${registryPath}`);
must(fs.existsSync(schemaPath), `Missing schema file: ${schemaPath}`);

const registryContent = fs.readFileSync(registryPath, "utf8");
const registry = YAML.parse(registryContent);
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

// Validate structure
must(registry && typeof registry === "object", "Registry must be an object");
must(Array.isArray(registry.agents), "Registry must contain an 'agents' array");
must(registry.agents.length > 0, "Registry must contain at least one agent");

// Valid enum values from schema
const validCategories = ["conversational", "infra", "system", "security", "audit"];
const validContexts = ["chat", "api", "github", "ci", "system", "security", "mobile"];
const validRiskLevels = ["low", "medium", "high", "critical"];
const validApprovalTypes = ["none", "manual", "automated"];
const validProfiles = ["development", "staging", "production"];

// Track unique IDs
const seenIds = new Set();

// Validate each agent
registry.agents.forEach((agent, index) => {
  const agentRef = `agents[${index}] (${agent.id || "unknown"})`;

  // Required fields
  must(agent.id, `${agentRef}: Missing 'id' field`);
  must(agent.name, `${agentRef}: Missing 'name' field`);
  must(agent.category, `${agentRef}: Missing 'category' field`);
  must(agent.contexts, `${agentRef}: Missing 'contexts' field`);
  must(agent.expose, `${agentRef}: Missing 'expose' field`);
  must(agent.risk, `${agentRef}: Missing 'risk' field`);
  must(agent.approval, `${agentRef}: Missing 'approval' field`);
  must(agent.startup, `${agentRef}: Missing 'startup' field`);
  must(agent.healthcheck, `${agentRef}: Missing 'healthcheck' field`);

  // ID validation
  must(/^[a-z0-9-]+$/.test(agent.id), `${agentRef}: ID must be lowercase alphanumeric with hyphens`);
  must(!seenIds.has(agent.id), `${agentRef}: Duplicate agent ID`);
  seenIds.add(agent.id);

  // Category validation
  must(validCategories.includes(agent.category), `${agentRef}: Invalid category '${agent.category}'`);

  // Contexts validation
  must(agent.contexts.allowed, `${agentRef}: Missing 'contexts.allowed' field`);
  must(Array.isArray(agent.contexts.allowed), `${agentRef}: contexts.allowed must be an array`);
  must(agent.contexts.allowed.length > 0, `${agentRef}: contexts.allowed must not be empty`);
  agent.contexts.allowed.forEach((ctx) => {
    must(validContexts.includes(ctx), `${agentRef}: Invalid context '${ctx}'`);
  });

  // Expose validation
  must(typeof agent.expose.selectable === "boolean", `${agentRef}: expose.selectable must be boolean`);
  must(typeof agent.expose.internal_only === "boolean", `${agentRef}: expose.internal_only must be boolean`);

  // Risk validation
  must(agent.risk.level, `${agentRef}: Missing 'risk.level' field`);
  must(validRiskLevels.includes(agent.risk.level), `${agentRef}: Invalid risk level '${agent.risk.level}'`);
  must(agent.risk.rationale, `${agentRef}: Missing 'risk.rationale' field`);
  must(agent.risk.rationale.length >= 10, `${agentRef}: risk.rationale must be at least 10 characters`);

  // Approval validation
  must(typeof agent.approval.required === "boolean", `${agentRef}: approval.required must be boolean`);
  must(agent.approval.type, `${agentRef}: Missing 'approval.type' field`);
  must(validApprovalTypes.includes(agent.approval.type), `${agentRef}: Invalid approval type '${agent.approval.type}'`);
  must(Array.isArray(agent.approval.approvers), `${agentRef}: approval.approvers must be an array`);
  
  // If approval required, must have approvers (unless type is 'none')
  if (agent.approval.required && agent.approval.type !== "none") {
    must(agent.approval.approvers.length > 0, `${agentRef}: approval.approvers must not be empty when approval is required`);
  }

  // Startup validation
  must(typeof agent.startup.auto_start === "boolean", `${agentRef}: startup.auto_start must be boolean`);
  must(agent.startup.auto_start === false, `${agentRef}: startup.auto_start must be false for security (no auto-start allowed)`);
  must(Array.isArray(agent.startup.allowed_profiles), `${agentRef}: startup.allowed_profiles must be an array`);
  must(agent.startup.allowed_profiles.length > 0, `${agentRef}: startup.allowed_profiles must not be empty`);
  agent.startup.allowed_profiles.forEach((profile) => {
    must(validProfiles.includes(profile), `${agentRef}: Invalid profile '${profile}'`);
  });

  // Healthcheck validation
  must(agent.healthcheck.endpoint, `${agentRef}: Missing 'healthcheck.endpoint' field`);
  const expectedEndpoint = `/api/agents/${agent.id}/health`;
  must(agent.healthcheck.endpoint === expectedEndpoint, 
    `${agentRef}: healthcheck.endpoint must be '${expectedEndpoint}' (got '${agent.healthcheck.endpoint}')`);
  must(typeof agent.healthcheck.interval_seconds === "number", `${agentRef}: healthcheck.interval_seconds must be a number`);
  must(agent.healthcheck.interval_seconds >= 30 && agent.healthcheck.interval_seconds <= 300, 
    `${agentRef}: healthcheck.interval_seconds must be between 30 and 300`);
});

// BSM Governance Rules
console.log("\n🔒 Enforcing BSM Governance Rules...");

registry.agents.forEach((agent) => {
  const agentRef = `${agent.id}`;

  // Rule 1: Destructive agents CANNOT have mobile context
  if (agent.safety?.mode === "destructive") {
    const hasMobile = agent.contexts.allowed.includes("mobile");
    must(
      !hasMobile,
      `${agentRef}: GOVERNANCE VIOLATION - destructive agents cannot allow 'mobile' context`
    );
  }

  // Rule 2: High/Critical risk must require approval
  if (agent.risk.level === "high" || agent.risk.level === "critical") {
    must(
      agent.approval.required === true,
      `${agentRef}: GOVERNANCE VIOLATION - high/critical risk agents must require approval`
    );
  }

  // Rule 3: Internal-only agents should not be selectable
  if (agent.expose.internal_only === true) {
    must(
      agent.expose.selectable === false,
      `${agentRef}: GOVERNANCE VIOLATION - internal_only agents should not be selectable`
    );
  }
});

console.log(`✅ Registry validation passed: ${registry.agents.length} agents validated`);
console.log(`   - Agents validated: ${Array.from(seenIds).join(", ")}`);
console.log(`   - All agents have auto_start=false (security requirement met)`);
console.log(`   - All governance fields present (risk, approval, startup, healthcheck)`);
console.log(`   - BSM governance rules enforced (destructive blocked from mobile)`);
