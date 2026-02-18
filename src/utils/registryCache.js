/**
 * Registry Cache Utility
 * Shared caching logic for agents/registry.yaml
 */

import { readFile, access } from "fs/promises";
import path from "path";
import YAML from "yaml";
import logger from "../utils/logger.js";

// Registry cache
let registryCache = null;
let registryLoadTime = 0;
const CACHE_TTL = 60000; // 1 minute

// In-flight promise to prevent cache stampede
let loadingPromise = null;

/**
 * Load and cache agents registry (async, prevents cache stampede)
 * 
 * @returns {Promise<object|null>} Parsed registry or null if not found
 */
export async function loadRegistry() {
  const now = Date.now();
  
  // Return cached if still valid
  if (registryCache && (now - registryLoadTime) < CACHE_TTL) {
    return registryCache;
  }

  // If already loading, return the existing promise (prevents cache stampede)
  if (loadingPromise) {
    logger.debug("Registry load already in progress, waiting for result");
    return loadingPromise;
  }

  const registryPath = path.join(process.cwd(), "agents", "registry.yaml");
  
  // Create loading promise
  loadingPromise = (async () => {
    try {
      // Check if registry exists
      await access(registryPath);
    } catch {
      logger.warn("agents/registry.yaml not found, using permissive mode");
      return null;
    }

    try {
      // Load and parse registry
      const content = await readFile(registryPath, "utf8");
      registryCache = YAML.parse(content);
      registryLoadTime = Date.now();
      
      logger.debug({ 
        agentCount: registryCache?.agents?.length,
        cached: true 
      }, "Registry loaded and cached");
      
      return registryCache;
    } catch (error) {
      logger.error({ error }, "Failed to load registry");
      return null;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/**
 * Clear registry cache (useful for testing)
 */
export function clearRegistryCache() {
  registryCache = null;
  registryLoadTime = 0;
  logger.debug("Registry cache cleared");
}

/**
 * Get cache status
 * 
 * @returns {object} Cache status information
 */
export function getRegistryCacheStatus() {
  const now = Date.now();
  const age = registryCache ? now - registryLoadTime : null;
  const isValid = registryCache && age < CACHE_TTL;
  
  return {
    cached: !!registryCache,
    age,
    valid: isValid,
    ttl: CACHE_TTL
  };
}
