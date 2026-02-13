import { readFile, access } from "fs/promises";
import path from "path";
import { mustExistDir } from "../utils/fsSafe.js";
import { AppError } from "../utils/errors.js";

// Cache for loaded knowledge with TTL
let knowledgeCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

// In-flight promise to prevent cache stampede
let loadingPromise = null;

export const loadKnowledgeIndex = async () => {
  try {
    // Return cached knowledge if still valid
    const now = Date.now();
    if (knowledgeCache && (now - cacheTimestamp) < CACHE_TTL) {
      return knowledgeCache;
    }

    // If already loading, return the existing promise (prevents cache stampede)
    if (loadingPromise) {
      return loadingPromise;
    }

    // Create loading promise
    loadingPromise = (async () => {
      try {
        const dir = path.join(process.cwd(), "data", "knowledge");
        mustExistDir(dir);

        const indexPath = path.join(dir, "index.json");
        const indexContent = await readFile(indexPath, "utf8");
        const index = JSON.parse(indexContent);

        if (!Array.isArray(index.documents)) {
          throw new AppError("Invalid knowledge index.json", 500, "KNOWLEDGE_INDEX_INVALID");
        }

        // Read all knowledge documents in parallel
        const documentPromises = index.documents.map(async (f) => {
          const p = path.join(dir, f);
          try {
            await access(p);
            return await readFile(p, "utf8");
          } catch {
            return "";
          }
        });

        const documents = await Promise.all(documentPromises);
        
        // Update cache
        knowledgeCache = documents;
        cacheTimestamp = Date.now();

        return documents;
      } finally {
        loadingPromise = null;
      }
    })();

    return loadingPromise;
  } catch (err) {
    throw new AppError(`Failed to load knowledge: ${err.message}`, 500, err.code || "KNOWLEDGE_LOAD_FAILED");
  }
};

// Clear cache (useful for testing or manual cache invalidation)
export const clearKnowledgeCache = () => {
  knowledgeCache = null;
  cacheTimestamp = 0;
};
