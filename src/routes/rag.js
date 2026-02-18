import { Router } from "express";
import { ragClient } from "../services/ragClient.js";
import { AppError } from "../utils/errors.js";
import { adminAuth } from "../middleware/auth.js";

const router = Router();

/**
 * RAG-powered chat endpoint
 */
router.post("/chat", async (req, res, next) => {
  try {
    const { message, language = "ar", use_rag = true, top_k = 3 } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      throw new AppError("Message is required", 400, "INVALID_INPUT");
    }

    const result = await ragClient.chat(message, {
      language,
      useRAG: use_rag,
      topK: top_k
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Semantic search across documents
 */
router.post("/search", async (req, res, next) => {
  try {
    const { query, language = "ar", top_k = 5, filters = null } = req.body;

    if (!query || typeof query !== "string" || !query.trim()) {
      throw new AppError("Query is required", 400, "INVALID_INPUT");
    }

    const result = await ragClient.search(query, {
      language,
      topK: top_k,
      filters
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * List documents
 */
router.get("/documents", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.page_size) || 20;

    const result = await ragClient.listDocuments(page, pageSize);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Get document details
 */
router.get("/documents/:id", async (req, res, next) => {
  try {
    const result = await ragClient.getDocument(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Upload document (admin only)
 */
router.post("/documents/upload", adminAuth, async (req, res, next) => {
  try {
    // This would need multer middleware for file upload
    // For now, returning not implemented
    throw new AppError("Document upload via Node.js not yet implemented. Use RAG service directly.", 501, "NOT_IMPLEMENTED");
  } catch (err) {
    next(err);
  }
});

/**
 * Delete document (admin only)
 */
router.delete("/documents/:id", adminAuth, async (req, res, next) => {
  try {
    const adminToken = req.headers["x-admin-token"];
    const result = await ragClient.deleteDocument(req.params.id, adminToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * RAG service health check
 */
router.get("/health", async (req, res, next) => {
  try {
    const isHealthy = await ragClient.healthCheck();
    res.json({
      status: isHealthy ? "healthy" : "unhealthy",
      service: "rag-service",
      connected: isHealthy
    });
  } catch (err) {
    next(err);
  }
});

export default router;
