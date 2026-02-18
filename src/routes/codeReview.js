import { Router } from "express";
import {
  reviewPullRequest,
  getReviewHistory,
  getReviewStatistics,
  getAllRepositories,
  getCacheStats,
  clearCache,
  postReviewComment
} from "../controllers/codeReviewController.js";
import { adminAuth } from "../middleware/auth.js";

const router = Router();

/**
 * POST /api/code-review/review
 * Review a GitHub pull request
 * Body: { repo, prNumber, forceRefresh }
 */
router.post("/review", reviewPullRequest);

/**
 * GET /api/code-review/history/:repo
 * Get review history for a repository
 * Query: ?limit=50
 */
router.get("/history/:repo", getReviewHistory);

/**
 * GET /api/code-review/statistics/:repo
 * Get statistics for a repository
 */
router.get("/statistics/:repo", getReviewStatistics);

/**
 * GET /api/code-review/repositories
 * Get all repositories with reviews
 */
router.get("/repositories", getAllRepositories);

/**
 * GET /api/code-review/cache/stats
 * Get cache statistics (admin only)
 */
router.get("/cache/stats", adminAuth, getCacheStats);

/**
 * POST /api/code-review/cache/clear
 * Clear cache (admin only)
 * Body: { repo?, prNumber? } - if empty, clears all
 */
router.post("/cache/clear", adminAuth, clearCache);

/**
 * POST /api/code-review/comment
 * Post review comment to GitHub PR
 * Body: { repo, prNumber, body }
 */
router.post("/comment", postReviewComment);

export default router;
