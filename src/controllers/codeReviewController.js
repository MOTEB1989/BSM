/**
 * Code Review Controller
 *
 * Handles code review requests, caching, and history tracking
 */

import fetch from "node-fetch";
import { intelligentCodeReviewAgent } from "../agents/IntelligentCodeReviewAgent.js";
import { reviewCacheService } from "../services/reviewCacheService.js";
import { reviewHistoryService } from "../services/reviewHistoryService.js";
import logger from "../utils/logger.js";
import { AppError } from "../utils/errors.js";

/**
 * Review a GitHub pull request
 */
export const reviewPullRequest = async (req, res, next) => {
  try {
    const { repo, prNumber, forceRefresh = false } = req.body;

    if (!repo || !prNumber) {
      throw new AppError("Missing required fields: repo, prNumber", 400);
    }

    if (!isValidGitHubRepo(repo)) {
      throw new AppError("Invalid repo format. Expected 'owner/repo' with allowed characters.", 400);
    }

    if (!isValidPullRequestNumber(prNumber)) {
      throw new AppError("Invalid pull request number. Expected a positive integer.", 400);
    }

    logger.info({ repo, prNumber, forceRefresh }, "Code review requested");

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = reviewCacheService.get(repo, prNumber);
      if (cached) {
        logger.info({ repo, prNumber }, "Returning cached review");
        return res.json({
          ...cached,
          cached: true
        });
      }
    }

    // Fetch PR data from GitHub
    const prData = await fetchPullRequestData(repo, prNumber);

    if (!prData) {
      throw new AppError("Failed to fetch PR data from GitHub", 500);
    }

    // Fetch diff
    const diff = await fetchPullRequestDiff(prData.diff_url);

    // Perform review
    const reviewResult = await intelligentCodeReviewAgent.review({
      prNumber,
      repo,
      title: prData.title,
      body: prData.body,
      author: prData.user?.login,
      files: prData.files || [],
      diff
    });

    // Cache the result
    reviewCacheService.set(repo, prNumber, reviewResult, prData.head?.sha);

    // Save to history
    await reviewHistoryService.saveReview(reviewResult);

    res.json({
      ...reviewResult,
      cached: false
    });
  } catch (error) {
    logger.error({ error: error.message }, "Review request failed");
    next(error);
  }
};

/**
 * Get review history for a repository
 */
export const getReviewHistory = async (req, res, next) => {
  try {
    const { repo } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    if (!repo) {
      throw new AppError("Missing repo parameter", 400);
    }

    const history = await reviewHistoryService.getHistory(repo, limit);

    res.json({
      repo,
      count: history.length,
      history
    });
  } catch (error) {
    logger.error({ error: error.message }, "Failed to get review history");
    next(error);
  }
};

/**
 * Get statistics for a repository
 */
export const getReviewStatistics = async (req, res, next) => {
  try {
    const { repo } = req.params;

    if (!repo) {
      throw new AppError("Missing repo parameter", 400);
    }

    const statistics = await reviewHistoryService.getStatistics(repo);

    res.json({
      repo,
      statistics
    });
  } catch (error) {
    logger.error({ error: error.message }, "Failed to get statistics");
    next(error);
  }
};

/**
 * Get all repositories with reviews
 */
export const getAllRepositories = async (req, res, next) => {
  try {
    const repos = await reviewHistoryService.getAllRepositories();

    res.json({
      count: repos.length,
      repositories: repos
    });
  } catch (error) {
    logger.error({ error: error.message }, "Failed to list repositories");
    next(error);
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async (req, res, next) => {
  try {
    const stats = reviewCacheService.getStats();

    res.json({
      cache: stats
    });
  } catch (error) {
    logger.error({ error: error.message }, "Failed to get cache stats");
    next(error);
  }
};

/**
 * Clear cache for a specific PR or entire cache
 */
export const clearCache = async (req, res, next) => {
  try {
    const { repo, prNumber } = req.body;

    if (repo && prNumber) {
      const deleted = reviewCacheService.invalidate(repo, prNumber);
      res.json({
        message: `Cache cleared for ${repo} PR #${prNumber}`,
        deleted
      });
    } else {
      const deleted = reviewCacheService.clear();
      res.json({
        message: "All cache cleared",
        deleted
      });
    }
  } catch (error) {
    logger.error({ error: error.message }, "Failed to clear cache");
    next(error);
  }
};

/**
 * Post review comment to GitHub PR
 */
export const postReviewComment = async (req, res, next) => {
  try {
    const { repo, prNumber, body } = req.body;

    if (!repo || !prNumber || !body) {
      throw new AppError("Missing required fields: repo, prNumber, body", 400);
    }

    // Validate repo format: "owner/repo" with allowed characters
    const repoPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
    if (typeof repo !== "string" || !repoPattern.test(repo)) {
      throw new AppError("Invalid repo format. Expected 'owner/repo' with alphanumeric, '.', '_', or '-' characters.", 400);
    }

    // Validate PR number: positive integer
    const pr = typeof prNumber === "number" ? prNumber : Number(prNumber);
    if (!Number.isInteger(pr) || pr <= 0) {
      throw new AppError("Invalid prNumber. Expected a positive integer.", 400);
    }

    const token = process.env.GITHUB_BSU_TOKEN;
    if (!token) {
      throw new AppError("GitHub token not configured", 500);
    }

    // Post comment to GitHub
    const response = await fetch(
      `https://api.github.com/repos/${repo}/issues/${pr}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json"
        },
        body: JSON.stringify({ body })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new AppError(`GitHub API error: ${errorText}`, response.status);
    }

    const comment = await response.json();

    logger.info({ repo, prNumber, commentId: comment.id }, "Review comment posted");

    res.json({
      message: "Comment posted successfully",
      comment: {
        id: comment.id,
        url: comment.html_url,
        created_at: comment.created_at
      }
    });
  } catch (error) {
    logger.error({ error: error.message }, "Failed to post review comment");
    next(error);
  }
};

/**
 * Helper: Fetch PR data from GitHub
 */
async function fetchPullRequestData(repo, prNumber) {
  const token = process.env.GITHUB_BSU_TOKEN;
  if (!token) {
    logger.warn("GitHub token not configured, PR data fetch may fail");
  }

  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "BSU-CodeReview-Agent"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${repo}/pulls/${prNumber}`,
    { headers }
  );

  if (!response.ok) {
    logger.error({ repo, prNumber, status: response.status }, "Failed to fetch PR data");
    return null;
  }

  const pr = await response.json();

  // Fetch files if not included
  if (!pr.files) {
    const filesResponse = await fetch(
      `https://api.github.com/repos/${repo}/pulls/${prNumber}/files`,
      { headers }
    );

    if (filesResponse.ok) {
      pr.files = await filesResponse.json();
    }
  }

  return pr;
}

/**
 * Helper: Fetch PR diff
 */
async function fetchPullRequestDiff(diffUrl) {
  try {
    const response = await fetch(diffUrl, {
      headers: {
        Accept: "application/vnd.github.v3.diff"
      }
    });

/**
 * Helper: Validate GitHub repository identifier ("owner/repo").
 * Allows alphanumeric characters, hyphens, underscores, and dots in each segment.
 */
function isValidGitHubRepo(repo) {
  if (typeof repo !== "string") {
    return false;
  }

  const parts = repo.split("/");
  if (parts.length !== 2) {
    return false;
  }

  const segmentPattern = /^[A-Za-z0-9._-]+$/;
  const [owner, name] = parts;

  if (!owner || !name) {
    return false;
  }

  return segmentPattern.test(owner) && segmentPattern.test(name);
}

/**
 * Helper: Validate pull request number (positive integer).
 */
function isValidPullRequestNumber(prNumber) {
  const num = typeof prNumber === "string" ? Number(prNumber) : prNumber;
  return Number.isInteger(num) && num > 0;
}

    if (!response.ok) {
      logger.error({ diffUrl, status: response.status }, "Failed to fetch diff");
      return "";
    }

    return await response.text();
  } catch (error) {
    logger.error({ error: error.message, diffUrl }, "Error fetching diff");
    return "";
  }
}
