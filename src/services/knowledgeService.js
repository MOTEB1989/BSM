import { createCachedFileLoader } from "../utils/cachedFileLoader.js";
import { AppError } from "../utils/errors.js";

const { load: loadDocuments, clear: clearCache } = createCachedFileLoader({
  name: "knowledge",
  dirPath: "data/knowledge",
  indexFile: "index.json",
  indexKey: "documents",
  parser: (content) => content,
  validator: () => true,
  cacheTTL: 60000,
  skipMissingFiles: true
});

/**
 * Load knowledge documents with caching
 */
export const loadKnowledgeIndex = async () => {
  try {
    return await loadDocuments();
  } catch (err) {
    throw new AppError(
      `Failed to load knowledge: ${err.message}`,
      500,
      err.code || "KNOWLEDGE_LOAD_FAILED"
    );
  }
};

/**
 * Get pre-joined knowledge string (optimized for prompt rendering)
 */
export const getKnowledgeString = async () => {
  const documents = await loadKnowledgeIndex();
  return documents.filter(Boolean).join("\n");
};

/**
 * Clear cache (useful for testing or manual cache invalidation)
 */
export const clearKnowledgeCache = () => clearCache();
