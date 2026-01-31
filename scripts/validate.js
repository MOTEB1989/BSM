import fs from "fs";
import path from "path";
import YAML from "yaml";

const must = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const allowedActions = new Set(["create_file"]);

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
