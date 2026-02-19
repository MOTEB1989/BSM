import { AppError } from '../utils/errors.js';

/**
 * Validation middleware for Observatory routes
 * Implements input validation as recommended in PR #21 code review
 */

// Allowlist for time range values
const VALID_TIME_RANGES = ['1h', '6h', '24h', '7d', '30d'];

// Regex patterns for validation
const AGENT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const NUMERIC_ID_PATTERN = /^\d+$/;

/**
 * Validate agentId parameter format
 * Ensures agentId contains only alphanumeric characters, hyphens, and underscores
 */
export function validateAgentId(req, res, next) {
  const { agentId } = req.params;
  
  if (!agentId || agentId.trim() === '') {
    return next(new AppError('Agent ID is required', 400, 'INVALID_AGENT_ID'));
  }
  
  if (!AGENT_ID_PATTERN.test(agentId)) {
    return next(new AppError('Invalid agent ID format. Only alphanumeric characters, hyphens, and underscores are allowed', 400, 'INVALID_AGENT_ID'));
  }
  
  if (agentId.length > 100) {
    return next(new AppError('Agent ID too long. Maximum 100 characters', 400, 'INVALID_AGENT_ID'));
  }
  
  next();
}

/**
 * Validate testId parameter (numeric)
 */
export function validateTestId(req, res, next) {
  const { testId } = req.params;
  
  if (!testId || !NUMERIC_ID_PATTERN.test(testId)) {
    return next(new AppError('Invalid test ID. Must be a positive integer', 400, 'INVALID_TEST_ID'));
  }
  
  const numericTestId = parseInt(testId, 10);
  if (numericTestId < 1 || numericTestId > Number.MAX_SAFE_INTEGER) {
    return next(new AppError('Test ID out of valid range', 400, 'INVALID_TEST_ID'));
  }
  
  next();
}

/**
 * Validate alertId parameter (numeric)
 */
export function validateAlertId(req, res, next) {
  const { alertId } = req.params;
  
  if (!alertId || !NUMERIC_ID_PATTERN.test(alertId)) {
    return next(new AppError('Invalid alert ID. Must be a positive integer', 400, 'INVALID_ALERT_ID'));
  }
  
  const numericAlertId = parseInt(alertId, 10);
  if (numericAlertId < 1 || numericAlertId > Number.MAX_SAFE_INTEGER) {
    return next(new AppError('Alert ID out of valid range', 400, 'INVALID_ALERT_ID'));
  }
  
  next();
}

/**
 * Validate historyId parameter (numeric)
 */
export function validateHistoryId(req, res, next) {
  const { historyId } = req.params;
  
  if (!historyId || !NUMERIC_ID_PATTERN.test(historyId)) {
    return next(new AppError('Invalid history ID. Must be a positive integer', 400, 'INVALID_HISTORY_ID'));
  }
  
  const numericHistoryId = parseInt(historyId, 10);
  if (numericHistoryId < 1 || numericHistoryId > Number.MAX_SAFE_INTEGER) {
    return next(new AppError('History ID out of valid range', 400, 'INVALID_HISTORY_ID'));
  }
  
  next();
}

/**
 * Validate timeRange query parameter
 * Uses allowlist to prevent injection attacks
 */
export function validateTimeRange(req, res, next) {
  const { timeRange } = req.query;
  
  // timeRange is optional, default to '24h' if not provided
  if (!timeRange) {
    return next();
  }
  
  if (!VALID_TIME_RANGES.includes(timeRange)) {
    return next(new AppError(
      `Invalid time range. Must be one of: ${VALID_TIME_RANGES.join(', ')}`,
      400,
      'INVALID_TIME_RANGE'
    ));
  }
  
  next();
}

/**
 * Validate limit query parameter
 */
export function validateLimit(req, res, next) {
  const { limit } = req.query;
  
  // limit is optional
  if (!limit) {
    return next();
  }
  
  if (!NUMERIC_ID_PATTERN.test(limit)) {
    return next(new AppError('Invalid limit. Must be a positive integer', 400, 'INVALID_LIMIT'));
  }
  
  const numericLimit = parseInt(limit, 10);
  if (numericLimit < 1 || numericLimit > 1000) {
    return next(new AppError('Limit out of valid range (1-1000)', 400, 'INVALID_LIMIT'));
  }
  
  next();
}

export default {
  validateAgentId,
  validateTestId,
  validateAlertId,
  validateHistoryId,
  validateTimeRange,
  validateLimit
};
