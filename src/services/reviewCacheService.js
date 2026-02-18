/**
 * Review Cache Service
 *
 * In-memory caching service for code review results with TTL
 * Can be easily upgraded to Redis when needed
 */

import logger from "../utils/logger.js";

class ReviewCacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = 3600000; // 1 hour default TTL
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0
    };
  }

  /**
   * Generate cache key for PR review
   */
  generateKey(repo, prNumber, commitSha = null) {
    if (commitSha) {
      return `review:${repo}:${prNumber}:${commitSha}`;
    }
    return `review:${repo}:${prNumber}`;
  }

  /**
   * Get cached review result
   */
  get(repo, prNumber, commitSha = null) {
    const key = this.generateKey(repo, prNumber, commitSha);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      logger.debug({ key }, "Cache miss");
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      logger.debug({ key }, "Cache expired");
      return null;
    }

    this.stats.hits++;
    logger.debug({ key }, "Cache hit");
    return entry.data;
  }

  /**
   * Set review result in cache
   */
  set(repo, prNumber, data, commitSha = null, customTtl = null) {
    const key = this.generateKey(repo, prNumber, commitSha);
    const ttl = customTtl || this.ttl;

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
      createdAt: Date.now()
    });

    this.stats.sets++;
    logger.debug({ key, ttl }, "Cache set");
  }

  /**
   * Invalidate cache for a PR
   */
  invalidate(repo, prNumber) {
    let deleted = 0;
    const prefix = `review:${repo}:${prNumber}`;

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    logger.info({ repo, prNumber, deleted }, "Cache invalidated");
    return deleted;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage (rough calculation)
   */
  estimateMemoryUsage() {
    let bytes = 0;
    for (const [key, value] of this.cache.entries()) {
      bytes += key.length * 2; // characters are 2 bytes
      bytes += JSON.stringify(value).length * 2;
    }
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  /**
   * Clear all cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    logger.info({ cleared: size }, "Cache cleared");
    return size;
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    let deleted = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
        deleted++;
      }
    }

    if (deleted > 0) {
      logger.info({ deleted }, "Expired cache entries cleaned up");
    }

    return deleted;
  }

  /**
   * Start periodic cleanup
   */
  startCleanupTimer(intervalMs = 300000) { // 5 minutes
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, intervalMs);

    logger.info({ intervalMs }, "Cache cleanup timer started");
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      logger.info("Cache cleanup timer stopped");
    }
  }
}

export const reviewCacheService = new ReviewCacheService();

// Start cleanup timer automatically
reviewCacheService.startCleanupTimer();

export default reviewCacheService;
