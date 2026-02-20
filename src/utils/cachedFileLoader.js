import { readFile } from "fs/promises";
import path from "path";
import YAML from "yaml";
import { mustExistDir } from "./fsSafe.js";
import { AppError } from "./errors.js";

/**
 * Generic Cached File Loader Factory
 * 
 * Creates a file loader with TTL caching and stampede prevention.
 * Eliminates duplication between agentsService.js and knowledgeService.js
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.name - Name for error messages
 * @param {string} options.dirPath - Directory path relative to cwd
 * @param {string} options.indexFile - Index file name
 * @param {string} options.indexKey - Key in index JSON for file array
 * @param {Function} options.parser - File content parser function
 * @param {Function} options.validator - Validation function for parsed content
 * @param {number} options.cacheTTL - Cache TTL in milliseconds (default: 60000)
 * @param {boolean} options.skipMissingFiles - If true, missing files yield empty string (default: false)
 * @returns {Object} Loader functions { load, clear }
 */
export const createCachedFileLoader = (options) => {
  const {
    name,
    dirPath,
    indexFile,
    indexKey,
    parser = (content) => content,
    validator = () => true,
    cacheTTL = 60000, // 1 minute default
    skipMissingFiles = false
  } = options;

  // Cache variables
  let cache = null;
  let cacheTimestamp = 0;
  let loadingPromise = null;

  /**
   * Load files with caching
   */
  const load = async () => {
    try {
      // Return cached data if still valid
      const now = Date.now();
      if (cache && (now - cacheTimestamp) < cacheTTL) {
        return cache;
      }

      // If already loading, return the existing promise (prevents cache stampede)
      if (loadingPromise) {
        return loadingPromise;
      }

      // Create loading promise
      loadingPromise = (async () => {
        try {
          const dir = path.join(process.cwd(), ...dirPath.split("/"));
          mustExistDir(dir);

          const indexPath = path.join(dir, indexFile);
          const indexContent = await readFile(indexPath, "utf8");
          const index = JSON.parse(indexContent);

          if (!Array.isArray(index[indexKey])) {
            throw new AppError(
              `Invalid ${name} ${indexFile}`,
              500,
              `${name.toUpperCase()}_INDEX_INVALID`
            );
          }

          // Read all files in parallel
          const filePromises = index[indexKey].map(async (file) => {
            const filePath = path.join(dir, file);
            let content;
            try {
              content = await readFile(filePath, "utf8");
            } catch (readErr) {
              if (skipMissingFiles) return "";
              throw readErr;
            }
            const parsed = parser(content);
            
            if (!validator(parsed, file)) {
              throw new AppError(
                `Invalid ${name} file: ${file}`,
                500,
                `${name.toUpperCase()}_INVALID`
              );
            }
            
            return parsed;
          });

          const data = await Promise.all(filePromises);
          
          // Update cache
          cache = data;
          cacheTimestamp = Date.now();

          return data;
        } finally {
          loadingPromise = null;
        }
      })();

      return loadingPromise;
    } catch (err) {
      throw new AppError(
        `Failed to load ${name}: ${err.message}`,
        500,
        err.code || `${name.toUpperCase()}_LOAD_FAILED`
      );
    }
  };

  /**
   * Clear cache (useful for testing or manual cache invalidation)
   */
  const clear = () => {
    cache = null;
    cacheTimestamp = 0;
  };

  return { load, clear };
};

/**
 * Create YAML file loader
 */
export const createYAMLLoader = (options) => {
  return createCachedFileLoader({
    ...options,
    parser: (content) => YAML.parse(content)
  });
};

/**
 * Create JSON file loader
 */
export const createJSONLoader = (options) => {
  return createCachedFileLoader({
    ...options,
    parser: (content) => JSON.parse(content)
  });
};
