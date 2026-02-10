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

console.log("OK: validation passed");
