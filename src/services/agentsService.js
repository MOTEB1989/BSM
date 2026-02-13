import { readFile } from "fs/promises";
import path from "path";
import YAML from "yaml";
import { mustExistDir } from "../utils/fsSafe.js";
import { AppError } from "../utils/errors.js";

// Cache for loaded agents with TTL
let agentsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

// In-flight promise to prevent cache stampede
let loadingPromise = null;

export const loadAgents = async () => {
  try {
    // Return cached agents if still valid
    const now = Date.now();
    if (agentsCache && (now - cacheTimestamp) < CACHE_TTL) {
      return agentsCache;
    }

    // If already loading, return the existing promise (prevents cache stampede)
    if (loadingPromise) {
      return loadingPromise;
    }

    // Create loading promise
    loadingPromise = (async () => {
      try {
        const dir = path.join(process.cwd(), "data", "agents");
        mustExistDir(dir);

        const indexPath = path.join(dir, "index.json");
        const indexContent = await readFile(indexPath, "utf8");
        const index = JSON.parse(indexContent);

        if (!Array.isArray(index.agents)) {
          throw new AppError("Invalid agents index.json", 500, "AGENTS_INDEX_INVALID");
        }

        // Read all agent files in parallel
        const agentPromises = index.agents.map(async (file) => {
          const content = await readFile(path.join(dir, file), "utf8");
          const parsed = YAML.parse(content);
          if (!parsed?.id) throw new AppError(`Agent file missing id: ${file}`, 500, "AGENT_INVALID");
          return parsed;
        });

        const agents = await Promise.all(agentPromises);
        
        // Update cache
        agentsCache = agents;
        cacheTimestamp = Date.now();

        return agents;
      } finally {
        loadingPromise = null;
      }
    })();

    return loadingPromise;
  } catch (err) {
    throw new AppError(`Failed to load agents: ${err.message}`, 500, err.code || "AGENTS_LOAD_FAILED");
  }
};

// Clear cache (useful for testing or manual cache invalidation)
export const clearAgentsCache = () => {
  agentsCache = null;
  cacheTimestamp = 0;
};
