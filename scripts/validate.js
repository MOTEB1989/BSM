import fs from "fs";
import path from "path";
import YAML from "yaml";

const must = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const allowedActions = new Set([
  "create_file",
  "review_pr",
  "request_changes",
  "approve_pr",
  "create_review_comment",
  "generate_fix_suggestion",
  "scan_vulnerabilities",
  "block_pr",
  "alert_security_team",
  "generate_security_report",
  "suggest_fixes",
  "auto_merge",
  "manual_review_request",
  "run_tests",
  "deploy_staging",
  "rollback_merge",
  "validate_structure",
  "cleanup_stale_prs",
  "archive_old_issues",
  "optimize_database",
  "generate_health_report",
  "audit_configuration",
  "validate_guards",
  "check_api_routes",
  "verify_ui_config",
  "generate_audit_report"
]);

const agentsDir = path.join(process.cwd(), "data", "agents");
must(fs.existsSync(agentsDir), "Missing data/agents directory");

const idx = JSON.parse(fs.readFileSync(path.join(agentsDir, "index.json"), "utf8"));
must(Array.isArray(idx.agents), "data/agents/index.json must contain agents: []");

idx.agents.forEach((file) => {
  const p = path.join(agentsDir, file);
  must(fs.existsSync(p), `Missing agent file: ${file}`);
  const parsed = YAML.parse(fs.readFileSync(p, "utf8"));
  must(parsed?.id, `Agent missing id in: ${file}`);
  if (parsed.actions) {
    must(Array.isArray(parsed.actions), `Agent actions must be an array in: ${file}`);
    parsed.actions.forEach((action) => {
      must(allowedActions.has(action), `Unsupported agent action "${action}" in: ${file}`);
    });
  }
});

// Validate registry
const registryPath = path.join(process.cwd(), "agents", "registry.yaml");
if (fs.existsSync(registryPath)) {
  console.log("Validating agents registry...");
  const registryContent = fs.readFileSync(registryPath, "utf8");
  const registry = YAML.parse(registryContent);
  must(registry && registry.agents, "Registry must contain agents array");
  must(Array.isArray(registry.agents), "Registry agents must be an array");
  
  // Check that all registry agents have required governance fields
  registry.agents.forEach((agent, idx) => {
    const ref = `registry agent ${idx} (${agent.id})`;
    must(agent.id, `${ref}: missing id`);
    must(agent.risk, `${ref}: missing risk field`);
    must(agent.approval, `${ref}: missing approval field`);
    must(agent.startup, `${ref}: missing startup field`);
    must(agent.healthcheck, `${ref}: missing healthcheck field`);
    must(agent.contexts?.allowed, `${ref}: missing contexts.allowed array`);
    must(agent.startup.auto_start === false, `${ref}: auto_start must be false`);
  });
  console.log(`✅ Registry validated: ${registry.agents.length} agents with governance fields`);
}

// Validate orchestrator configuration
const orchestratorConfigPath = path.join(process.cwd(), ".github", "agents", "orchestrator.config.json");
if (fs.existsSync(orchestratorConfigPath)) {
  console.log("Validating orchestrator configuration...");
  try {
    const configContent = fs.readFileSync(orchestratorConfigPath, "utf8");
    const config = JSON.parse(configContent);
    
    // Basic validation
    must(config.name, "Orchestrator config missing name");
    must(config.version, "Orchestrator config missing version");
    must(config.agents, "Orchestrator config missing agents array");
    must(Array.isArray(config.agents) && config.agents.length > 0, "Orchestrator config must have non-empty agents array");
    
    // Validate secrets.logging.logSecrets is never true
    if (config.secrets?.logging?.logSecrets === true) {
      throw new Error("Security violation: secrets.logging.logSecrets must never be true");
    }
    
    console.log(`✅ Orchestrator config validated: ${config.agents.length} agents configured`);
  } catch (err) {
    console.error("❌ Invalid orchestrator config:", err.message);
    process.exit(1);
  }
}

console.log("OK: validation passed");
