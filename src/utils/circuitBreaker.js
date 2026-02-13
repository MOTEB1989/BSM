/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by failing fast when external services are down
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service failing, requests rejected immediately
 * - HALF_OPEN: Testing recovery, allowing limited requests
 */

import logger from './logger.js';

export class CircuitBreaker {
  constructor(options = {}) {
    this.name = options.name || 'circuit-breaker';
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 60 seconds
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = Date.now();
    
    this.stats = {
      total: 0,
      failures: 0,
      successes: 0,
      rejections: 0
    };
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        this.stats.rejections++;
        const error = new Error(`Circuit breaker '${this.name}' is OPEN`);
        error.code = 'CIRCUIT_BREAKER_OPEN';
        throw error;
      }
      
      // Transition to HALF_OPEN
      logger.info({ name: this.name }, 'Circuit breaker transitioning to HALF_OPEN');
      this.state = 'HALF_OPEN';
      this.failures = 0;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.successes++;
    this.stats.successes++;
    this.stats.total++;
    
    if (this.state === 'HALF_OPEN') {
      logger.info({ name: this.name }, 'Circuit breaker recovered, transitioning to CLOSED');
      this.state = 'CLOSED';
    }
  }

  onFailure() {
    this.failures++;
    this.stats.failures++;
    this.stats.total++;
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      
      logger.error({
        name: this.name,
        failures: this.failures,
        resetTimeout: this.resetTimeout
      }, 'Circuit breaker opened due to failures');
    }
  }

  getState() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      nextAttempt: this.nextAttempt,
      stats: this.stats
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = Date.now();
    logger.info({ name: this.name }, 'Circuit breaker manually reset');
  }
}

// Export a registry for tracking all circuit breakers
export const circuitBreakers = new Map();

/**
 * Get or create a circuit breaker by name
 */
export function getCircuitBreaker(name, options = {}) {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker({ name, ...options }));
  }
  return circuitBreakers.get(name);
}

/**
 * Get stats for all circuit breakers
 */
export function getAllCircuitBreakerStats() {
  const stats = {};
  for (const [name, breaker] of circuitBreakers.entries()) {
    stats[name] = breaker.getState();
  }
  return stats;
}
