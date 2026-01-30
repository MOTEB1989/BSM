import fs from "fs";
import path from "path";
import YAML from "yaml";
import { mustExistDir } from "../utils/fsSafe.js";
import { AppError } from "../utils/errors.js";

export const loadAgents = async () => {
  try {
    const dir = path.join(process.cwd(), "data", "agents");
    mustExistDir(dir);

    const indexPath = path.join(dir, "index.json");
    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));

    if (!Array.isArray(index.agents)) {
      throw new AppError("Invalid agents index.json", 500, "AGENTS_INDEX_INVALID");
    }

    const agents = index.agents.map((file) => {
      const content = fs.readFileSync(path.join(dir, file), "utf8");
      const parsed = YAML.parse(content);
      if (!parsed?.id) throw new AppError(`Agent file missing id: ${file}`, 500, "AGENT_INVALID");
      return parsed;
    });

    return agents;
  } catch (err) {
    throw new AppError(`Failed to load agents: ${err.message}`, 500, err.code || "AGENTS_LOAD_FAILED");
  }
};
