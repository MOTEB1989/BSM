/**
 * In-memory cache for agent registry and agent definitions
 * Implements TTL-based caching to avoid redundant disk I/O operations
 */

import fs from "fs/promises";
import path from "path";
import YAML from "yaml";
import logger from "./logger.js";
import { AppError } from "./errors.js";

class AgentCache {
  constructor(ttl = 60000) {
    this.ttl = ttl; // Time-to-live in milliseconds (default: 60 seconds)
    this.cache = {
      registry: null,
      agents: null,
      timestamp: 0,
    };
  }

  /**
   * Check if cache is still valid
   */
  isValid() {
    const now = Date.now();
    return this.cache.registry && this.cache.agents && (now - this.cache.timestamp) < this.ttl;
  }

  /**
   * Load registry from disk (async)
   */
  async loadRegistry() {
    try {
      const registryPath = path.join(process.cwd(), "agents", "registry.yaml");
      const content = await fs.readFile(registryPath, "utf8");
      return YAML.parse(content);
    } catch (error) {
      throw new AppError("Registry not found or invalid", 500, "REGISTRY_NOT_FOUND");
    }
  }

  /**
   * Load all agents from disk (async, parallel)
   */
  async loadAgents() {
    try {
      const dir = path.join(process.cwd(), "data", "agents");
      
      // Check if directory exists
      try {
        await fs.access(dir);
      } catch {
        throw new AppError("Agents directory not found", 500, "AGENTS_DIR_NOT_FOUND");
      }

      const indexPath = path.join(dir, "index.json");
      const indexContent = await fs.readFile(indexPath, "utf8");
      const index = JSON.parse(indexContent);

      if (!Array.isArray(index.agents)) {
        throw new AppError("Invalid agents index.json", 500, "AGENTS_INDEX_INVALID");
      }

      // Load all agent files in parallel
      const agents = await Promise.all(
        index.agents.map(async (file) => {
          try {
            const content = await fs.readFile(path.join(dir, file), "utf8");
            const parsed = YAML.parse(content);
            
            if (!parsed?.id) {
              throw new AppError(`Agent file missing id: ${file}`, 500, "AGENT_INVALID");
            }
            
            return parsed;
          } catch (error) {
            logger.warn({ file, error: error.message }, "Failed to load agent file");
            return null;
          }
        })
      );

      // Filter out failed loads
      return agents.filter(agent => agent !== null);
    } catch (err) {
      throw new AppError(`Failed to load agents: ${err.message}`, 500, err.code || "AGENTS_LOAD_FAILED");
    }
  }

  /**
   * Get cached registry and agents, refresh if expired
   */
  async get() {
    if (this.isValid()) {
      logger.debug("Returning cached registry and agents");
      return {
        registry: this.cache.registry,
        agents: this.cache.agents,
      };
    }

    logger.info("Cache expired or empty, refreshing from disk");
    
    try {
      // Load registry and agents in parallel
      const [registry, agents] = await Promise.all([
        this.loadRegistry(),
        this.loadAgents()
      ]);

      // Update cache
      this.cache.registry = registry;
      this.cache.agents = agents;
      this.cache.timestamp = Date.now();

      logger.info({ 
        agentsCount: agents.length, 
        registryAgentsCount: registry.agents?.length 
      }, "Agent cache refreshed");

      return {
        registry,
        agents,
      };
    } catch (error) {
      logger.error({ error: error.message }, "Failed to refresh agent cache");
      
      // If cache refresh fails but we have stale cache, return it with a warning
      if (this.cache.registry && this.cache.agents) {
        logger.warn("Returning stale cache due to refresh failure");
        return {
          registry: this.cache.registry,
          agents: this.cache.agents,
        };
      }
      
      throw error;
    }
  }

  /**
   * Get registry only
   */
  async getRegistry() {
    const { registry } = await this.get();
    return registry;
  }

  /**
   * Get agents only
   */
  async getAgents() {
    const { agents } = await this.get();
    return agents;
  }

  /**
   * Find a specific agent by ID
   */
  async findAgent(agentId) {
    const { agents } = await this.get();
    return agents.find(agent => agent.id === agentId);
  }

  /**
   * Manually invalidate cache (force refresh on next get)
   */
  invalidate() {
    logger.info("Agent cache manually invalidated");
    this.cache.timestamp = 0;
  }

  /**
   * Clear cache entirely
   */
  clear() {
    logger.info("Agent cache cleared");
    this.cache = {
      registry: null,
      agents: null,
      timestamp: 0,
    };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const age = this.cache.timestamp ? Date.now() - this.cache.timestamp : null;
    return {
      isValid: this.isValid(),
      age: age ? Math.floor(age / 1000) : null, // in seconds
      ttl: Math.floor(this.ttl / 1000), // in seconds
      hasRegistry: !!this.cache.registry,
      hasAgents: !!this.cache.agents,
      agentsCount: this.cache.agents?.length || 0,
    };
  }
}

// Export singleton instance with 60-second TTL
export const agentCache = new AgentCache(60000);

// Export class for testing
export { AgentCache };
