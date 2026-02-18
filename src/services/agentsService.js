import { agentCache } from "../utils/agentCache.js";

/**
 * Load agents with caching
 * @deprecated Use agentCache.getAgents() directly for better performance
 */
export const loadAgents = async () => {
  return await agentCache.getAgents();
};
