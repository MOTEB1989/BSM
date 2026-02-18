import logger from "./logger.js";

// Global registry of circuit breakers for health monitoring
const circuitBreakers = new Map();

/**
 * Circuit Breaker pattern implementation
 * Prevents cascading failures by monitoring API calls and opening the circuit after threshold failures
 */
export class CircuitBreaker {
  constructor(func, options = {}) {
    this.func = func;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 60 seconds
    this.name = options.name || "circuit";
    
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.nextAttempt = Date.now();
    this.successCount = 0;
    
    // Register this circuit breaker for health monitoring
    circuitBreakers.set(this.name, this);
  }

  async execute(...args) {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
      // Try to recover
      this.state = "HALF_OPEN";
      logger.info(`[CircuitBreaker:${this.name}] Attempting recovery (HALF_OPEN)`);
    }

    try {
      const result = await this.func(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    
    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= 2) {
        this.state = "CLOSED";
        this.successCount = 0;
        logger.info(`[CircuitBreaker:${this.name}] Circuit CLOSED (recovered)`);
      }
    }
  }

  onFailure() {
    this.failureCount++;
    this.successCount = 0;

    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.resetTimeout;
      logger.error(`[CircuitBreaker:${this.name}] Circuit OPEN (failures: ${this.failureCount})`);
    }
  }

  isOpen() {
    return this.state === "OPEN" && Date.now() < this.nextAttempt;
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      nextAttempt: this.state === "OPEN" ? new Date(this.nextAttempt).toISOString() : null
    };
  }
}

/**
 * Get stats for all registered circuit breakers
 * Used by health check endpoint
 */
export function getAllCircuitBreakerStats() {
  const stats = {};
  for (const [name, breaker] of circuitBreakers.entries()) {
    stats[name] = breaker.getState();
  }
  return stats;
}

/**
 * Get or create a circuit breaker by name
 * Factory function for easy access to circuit breakers
 */
export function getCircuitBreaker(name, options = {}) {
  if (!circuitBreakers.has(name)) {
    // Create a no-op function for factory-created breakers
    const noop = async () => {};
    circuitBreakers.set(name, new CircuitBreaker(noop, { name, ...options }));
  }
  return circuitBreakers.get(name);
}


