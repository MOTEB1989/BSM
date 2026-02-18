/**
 * Review History Service
 *
 * Tracks code review history, statistics, and trends
 */

import fs from "fs/promises";
import path from "path";
import logger from "../utils/logger.js";

const HISTORY_DIR = path.join(process.cwd(), "data", "review-history");
const MAX_HISTORY_PER_REPO = 100;

class ReviewHistoryService {
  constructor() {
    this.historyCache = new Map();
    this.initialized = false;
  }

  /**
   * Initialize service (create directory if needed)
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await fs.mkdir(HISTORY_DIR, { recursive: true });
      this.initialized = true;
      logger.info({ dir: HISTORY_DIR }, "Review history service initialized");
    } catch (error) {
      logger.error({ error: error.message }, "Failed to initialize review history service");
      throw error;
    }
  }

  /**
   * Save review to history
   */
  async saveReview(reviewData) {
    await this.initialize();

    const {
      repo,
      prNumber,
      score,
      securityAnalysis,
      qualityAnalysis,
      performanceAnalysis,
      timestamp,
      agentId
    } = reviewData;

    const historyEntry = {
      prNumber,
      score,
      securityScore: securityAnalysis?.aiAnalysis?.score || null,
      qualityScore: qualityAnalysis?.aiAnalysis?.score || null,
      securityRiskLevel: securityAnalysis?.riskLevel || "unknown",
      securityFindings: securityAnalysis?.findings?.length || 0,
      performanceConcerns: performanceAnalysis?.issues?.length || 0,
      timestamp,
      agentId
    };

    try {
      // Get repo slug for filename
      const repoSlug = this.sanitizeRepoName(repo);
      const filePath = path.join(HISTORY_DIR, `${repoSlug}.json`);

      // Load existing history
      let history = [];
      try {
        const content = await fs.readFile(filePath, "utf-8");
        history = JSON.parse(content);
      } catch (error) {
        // File doesn't exist yet, start with empty array
        if (error.code !== "ENOENT") {
          throw error;
        }
      }

      // Add new entry
      history.unshift(historyEntry);

      // Limit history size
      if (history.length > MAX_HISTORY_PER_REPO) {
        history = history.slice(0, MAX_HISTORY_PER_REPO);
      }

      // Save back to file
      await fs.writeFile(filePath, JSON.stringify(history, null, 2), "utf-8");

      // Update cache
      this.historyCache.set(repoSlug, history);

      logger.info({ repo, prNumber, score }, "Review saved to history");
      return historyEntry;
    } catch (error) {
      logger.error({ error: error.message, repo }, "Failed to save review history");
      throw error;
    }
  }

  /**
   * Get review history for a repository
   */
  async getHistory(repo, limit = 50) {
    await this.initialize();

    const repoSlug = this.sanitizeRepoName(repo);

    // Check cache first
    if (this.historyCache.has(repoSlug)) {
      const cached = this.historyCache.get(repoSlug);
      return cached.slice(0, limit);
    }

    try {
      const filePath = path.join(HISTORY_DIR, `${repoSlug}.json`);
      const content = await fs.readFile(filePath, "utf-8");
      const history = JSON.parse(content);

      // Update cache
      this.historyCache.set(repoSlug, history);

      return history.slice(0, limit);
    } catch (error) {
      if (error.code === "ENOENT") {
        return []; // No history yet
      }
      logger.error({ error: error.message, repo }, "Failed to load review history");
      throw error;
    }
  }

  /**
   * Get statistics for a repository
   */
  async getStatistics(repo) {
    const history = await this.getHistory(repo, MAX_HISTORY_PER_REPO);

    if (history.length === 0) {
      return {
        totalReviews: 0,
        averageScore: 0,
        averageSecurityScore: 0,
        averageQualityScore: 0,
        securityRiskDistribution: {},
        scoreDistribution: {},
        recentTrend: "no-data"
      };
    }

    // Calculate statistics
    const totalReviews = history.length;
    const scores = history.filter(h => h.score != null).map(h => h.score);
    const securityScores = history.filter(h => h.securityScore != null).map(h => h.securityScore);
    const qualityScores = history.filter(h => h.qualityScore != null).map(h => h.qualityScore);

    const averageScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    const averageSecurityScore = securityScores.length > 0
      ? securityScores.reduce((a, b) => a + b, 0) / securityScores.length
      : 0;

    const averageQualityScore = qualityScores.length > 0
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
      : 0;

    // Security risk distribution
    const securityRiskDistribution = {};
    history.forEach(h => {
      const risk = h.securityRiskLevel || "unknown";
      securityRiskDistribution[risk] = (securityRiskDistribution[risk] || 0) + 1;
    });

    // Score distribution (buckets: 0-3, 4-6, 7-8, 9-10)
    const scoreDistribution = {
      "0-3": 0,
      "4-6": 0,
      "7-8": 0,
      "9-10": 0
    };

    scores.forEach(score => {
      if (score <= 3) scoreDistribution["0-3"]++;
      else if (score <= 6) scoreDistribution["4-6"]++;
      else if (score <= 8) scoreDistribution["7-8"]++;
      else scoreDistribution["9-10"]++;
    });

    // Recent trend (last 10 vs previous 10)
    const recentTrend = this.calculateTrend(scores);

    return {
      totalReviews,
      averageScore: Math.round(averageScore * 10) / 10,
      averageSecurityScore: Math.round(averageSecurityScore * 10) / 10,
      averageQualityScore: Math.round(averageQualityScore * 10) / 10,
      securityRiskDistribution,
      scoreDistribution,
      recentTrend
    };
  }

  /**
   * Calculate trend (improving, declining, stable)
   */
  calculateTrend(scores) {
    if (scores.length < 10) return "insufficient-data";

    const recent = scores.slice(0, 10);
    const previous = scores.slice(10, 20);

    if (previous.length < 5) return "insufficient-data";

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;

    const diff = recentAvg - previousAvg;

    if (diff > 0.5) return "improving";
    if (diff < -0.5) return "declining";
    return "stable";
  }

  /**
   * Get all repositories with reviews
   */
  async getAllRepositories() {
    await this.initialize();

    try {
      const files = await fs.readdir(HISTORY_DIR);
      const repos = files
        .filter(f => f.endsWith(".json"))
        .map(f => this.unsanitizeRepoName(f.replace(".json", "")));

      return repos;
    } catch (error) {
      logger.error({ error: error.message }, "Failed to list repositories");
      return [];
    }
  }

  /**
   * Sanitize repo name for filename
   */
  sanitizeRepoName(repo) {
    return repo.replace(/[^a-zA-Z0-9-]/g, "_").toLowerCase();
  }

  /**
   * Unsanitize repo name from filename
   */
  unsanitizeRepoName(slug) {
    // This is a simple reverse, may not perfectly reconstruct original
    // Consider storing a mapping if exact reconstruction is needed
    return slug.replace(/_/g, "/");
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.historyCache.clear();
    logger.info("Review history cache cleared");
  }
}

export const reviewHistoryService = new ReviewHistoryService();
export default reviewHistoryService;
