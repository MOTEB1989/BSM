import fs from "fs";
import path from "path";
import YAML from "yaml";

const must = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const agentsDir = path.join(process.cwd(), "data", "agents");
must(fs.existsSync(agentsDir), "Missing data/agents directory");

const idx = JSON.parse(fs.readFileSync(path.join(agentsDir, "index.json"), "utf8"));
must(Array.isArray(idx.agents), "data/agents/index.json must contain agents: []");

idx.agents.forEach((file) => {
  const p = path.join(agentsDir, file);
  must(fs.existsSync(p), `Missing agent file: ${file}`);
  const parsed = YAML.parse(fs.readFileSync(p, "utf8"));
  must(parsed?.id, `Agent missing id in: ${file}`);
});

console.log("OK: validation passed");
