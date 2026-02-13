import fs from "fs";
import path from "path";
import YAML from "yaml";

const root = process.cwd();
const agentsDir = path.join(root, "data", "agents");
const indexPath = path.join(agentsDir, "index.json");
const registryPath = path.join(root, "agents", "registry.yaml");

const failures = [];

const fail = (message) => failures.push(message);

const mustExist = (filePath, label) => {
  if (!fs.existsSync(filePath)) {
    fail(`Missing ${label}: ${filePath}`);
    return false;
  }
  return true;
};

const stable = (value) => {
  if (Array.isArray(value)) {
    const normalized = value.map(stable);
    if (normalized.every((item) => typeof item !== "object" || item === null)) {
      return [...normalized].sort();
    }
    return [...normalized].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }

  if (value && typeof value === "object") {
    const out = {};
    Object.keys(value)
      .sort()
      .forEach((k) => {
        out[k] = stable(value[k]);
      });
    return out;
  }

  return value;
};

const same = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));

if (mustExist(indexPath, "agent index") && mustExist(registryPath, "registry file")) {
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const listedFiles = index?.agents;

  if (!Array.isArray(listedFiles)) {
    fail("data/agents/index.json must contain an agents array");
  } else {
    const dataAgentsById = new Map();

    for (const file of listedFiles) {
      const filePath = path.join(agentsDir, file);
      if (!mustExist(filePath, `agent file from index (${file})`)) {
        continue;
      }

      const parsed = YAML.parse(fs.readFileSync(filePath, "utf8"));
      if (!parsed?.id) {
        fail(`Agent file ${file} is missing required field: id`);
        continue;
      }

      if (dataAgentsById.has(parsed.id)) {
        fail(`Duplicate id in data/agents files: ${parsed.id} (from ${file})`);
        continue;
      }

      dataAgentsById.set(parsed.id, { file, data: parsed });
    }

    const registry = YAML.parse(fs.readFileSync(registryPath, "utf8"));
    if (!Array.isArray(registry?.agents)) {
      fail("agents/registry.yaml must contain an agents array");
    } else {
      const registryById = new Map();

      for (const agent of registry.agents) {
        if (!agent?.id) {
          fail("Found registry agent entry without id");
          continue;
        }
        if (registryById.has(agent.id)) {
          fail(`Duplicate id in agents/registry.yaml: ${agent.id}`);
          continue;
        }
        registryById.set(agent.id, agent);
      }

      const dataIds = new Set(dataAgentsById.keys());
      const registryIds = new Set(registryById.keys());

      const missingInRegistry = [...dataIds].filter((id) => !registryIds.has(id)).sort();
      const missingInData = [...registryIds].filter((id) => !dataIds.has(id)).sort();

      if (missingInRegistry.length > 0) {
        fail(`IDs موجودة في data/agents وغير موجودة في agents/registry.yaml: ${missingInRegistry.join(", ")}`);
      }

      if (missingInData.length > 0) {
        fail(`IDs موجودة في agents/registry.yaml وغير موجودة في data/agents: ${missingInData.join(", ")}`);
      }

      const criticalFields = ["contexts", "safety", "expose", "risk"];
      for (const id of [...dataIds].filter((x) => registryIds.has(x)).sort()) {
        const dataAgent = dataAgentsById.get(id).data;
        const registryAgent = registryById.get(id);

        for (const field of criticalFields) {
          if (!(field in dataAgent)) {
            fail(`${id}: field '${field}' مفقود في data/agents/${dataAgentsById.get(id).file}`);
            continue;
          }

          if (!(field in registryAgent)) {
            fail(`${id}: field '${field}' مفقود في agents/registry.yaml`);
            continue;
          }

          if (!same(dataAgent[field], registryAgent[field])) {
            fail(
              `${id}: mismatch في field '${field}'\n  data: ${JSON.stringify(stable(dataAgent[field]))}\n  registry: ${JSON.stringify(stable(registryAgent[field]))}`
            );
          }
        }
      }
    }
  }
}

if (failures.length > 0) {
  console.error("❌ Agent sync validation failed. Please reconcile data/agents with agents/registry.yaml.");
  failures.forEach((item, index) => console.error(`${index + 1}. ${item}`));
  process.exit(1);
}

console.log("✅ Agent sync validation passed: IDs and critical fields are aligned between data/agents and agents/registry.yaml.");
