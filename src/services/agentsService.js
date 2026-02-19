import { createYAMLLoader } from "../utils/cachedFileLoader.js";

// Create cached YAML loader for agents
const { load: loadAgents, clear: clearAgentsCache } = createYAMLLoader({
  name: "agents",
  dirPath: "data/agents",
  indexFile: "index.json",
  indexKey: "agents",
  validator: (parsed, file) => {
    if (!parsed?.id) {
      throw new Error(`Agent file missing id: ${file}`);
    }
    return true;
  },
  cacheTTL: 60000 // 1 minute
});

export { loadAgents, clearAgentsCache };
