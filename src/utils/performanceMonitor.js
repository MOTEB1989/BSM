import logger from "./logger.js";

/**
 * Performance monitoring utility
 * Tracks and logs operation timings to identify bottlenecks
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      fileOperation: 100,    // ms
      apiCall: 1000,         // ms
      agentExecution: 5000,  // ms
      healthCheck: 500,      // ms
      dbQuery: 200          // ms
    };
  }

  /**
   * Start timing an operation
   * @param {string} operationId - Unique identifier for the operation
   * @param {string} operationType - Type of operation (fileOperation, apiCall, etc.)
   * @returns {Function} End function to call when operation completes
   */
  start(operationId, operationType = "general") {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    return (metadata = {}) => {
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();
      const memoryDelta = {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external
      };

      const metric = {
        operationId,
        operationType,
        duration,
        memoryDelta,
        timestamp: new Date().toISOString(),
        ...metadata
      };

      // Store metric
      this.metrics.set(operationId, metric);

      // Log if exceeds threshold
      const threshold = this.thresholds[operationType] || 1000;
      if (duration > threshold) {
        logger.warn({
          ...metric,
          threshold
        }, `Slow operation detected: ${operationType}`);
      }

      // Clean up old metrics (keep last 100)
      this._cleanupOldMetrics();

      return metric;
    };
  }

  /**
   * Measure a function execution time
   * @param {string} name - Operation name
   * @param {Function} fn - Function to measure
   * @param {string} type - Operation type
   * @returns {Promise<any>} Function result
   */
  async measure(name, fn, type = "general") {
    const end = this.start(name, type);
    try {
      const result = await fn();
      end({ status: "success" });
      return result;
    } catch (error) {
      end({ status: "error", error: error.message });
      throw error;
    }
  }

  /**
   * Get performance summary
   * @returns {Object} Performance statistics
   */
  getSummary() {
    const metrics = Array.from(this.metrics.values());
    
    if (metrics.length === 0) {
      return {
        totalOperations: 0,
        avgDuration: 0,
        slowOperations: 0
      };
    }

    const durations = metrics.map(m => m.duration);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    
    const slowOperations = metrics.filter(m => {
      const threshold = this.thresholds[m.operationType] || 1000;
      return m.duration > threshold;
    });

    return {
      totalOperations: metrics.length,
      avgDuration: Math.round(avgDuration),
      maxDuration,
      minDuration,
      slowOperations: slowOperations.length,
      byType: this.getMetricsByType(metrics)
    };
  }

  /**
   * Get metrics grouped by operation type
   * @param {Array} metrics - Array of metrics
   * @returns {Object} Metrics grouped by type
   */
  getMetricsByType(metrics) {
    const byType = {};
    
    for (const metric of metrics) {
      if (!byType[metric.operationType]) {
        byType[metric.operationType] = {
          count: 0,
          totalDuration: 0,
          avgDuration: 0
        };
      }
      
      byType[metric.operationType].count++;
      byType[metric.operationType].totalDuration += metric.duration;
    }

    // Calculate averages
    for (const type in byType) {
      byType[type].avgDuration = Math.round(
        byType[type].totalDuration / byType[type].count
      );
    }

    return byType;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
  }

  /**
   * Update threshold for a specific operation type
   * @param {string} type - Operation type
   * @param {number} threshold - Threshold in milliseconds
   */
  setThreshold(type, threshold) {
    this.thresholds[type] = threshold;
  }

  /**
   * Internal: Clean up old metrics
   * Note: Assumes metrics are added in chronological order and never deleted individually.
   * If metrics can be deleted out of order, use explicit timestamp tracking instead.
   */
  _cleanupOldMetrics() {
    if (this.metrics.size > 100) {
      // Maps maintain insertion order, so first key is oldest
      // This is safe because we only delete here or in clear()
      const oldestKey = this.metrics.keys().next().value;
      this.metrics.delete(oldestKey);
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator function to measure async function performance
 * @param {string} name - Operation name
 * @param {string} type - Operation type
 * @returns {Function} Decorator function
 */
export function measurePerformance(name, type = "general") {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      return performanceMonitor.measure(
        `${name || propertyKey}`,
        () => originalMethod.apply(this, args),
        type
      );
    };

    return descriptor;
  };
}

export default performanceMonitor;
