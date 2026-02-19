import { AppError } from '../utils/errors.js';

// Valid time range values
const VALID_TIME_RANGES = ['1h', '6h', '24h', '7d', '30d'];

// Validate agentId format (alphanumeric, underscore, dash, 1-100 chars)
export const validateAgentId = (req, res, next) => {
  const { agentId } = req.params;
  
  if (!agentId) {
    throw new AppError('Agent ID is required', 400, 'INVALID_INPUT');
  }
  
  // Check length
  if (agentId.length < 1 || agentId.length > 100) {
    throw new AppError('Agent ID must be between 1 and 100 characters', 400, 'INVALID_INPUT');
  }
  
  // Check format: alphanumeric, underscore, dash only
  const agentIdRegex = /^[a-zA-Z0-9_-]+$/;
  if (!agentIdRegex.test(agentId)) {
    throw new AppError('Agent ID must contain only alphanumeric characters, underscores, and dashes', 400, 'INVALID_INPUT');
  }
  
  next();
};

// Validate timeRange query parameter (allowlist)
export const validateTimeRange = (req, res, next) => {
  const { timeRange } = req.query;
  
  // timeRange is optional, skip validation if not provided
  if (!timeRange) {
    return next();
  }
  
  if (!VALID_TIME_RANGES.includes(timeRange)) {
    throw new AppError(
      `Invalid time range. Must be one of: ${VALID_TIME_RANGES.join(', ')}`,
      400,
      'INVALID_INPUT'
    );
  }
  
  next();
};

// Validate testId parameter (integer >= 1)
export const validateTestId = (req, res, next) => {
  const { testId } = req.params;
  
  if (!testId) {
    throw new AppError('Test ID is required', 400, 'INVALID_INPUT');
  }
  
  const testIdNum = parseInt(testId, 10);
  
  if (isNaN(testIdNum) || testIdNum < 1 || !Number.isInteger(testIdNum)) {
    throw new AppError('Test ID must be a positive integer', 400, 'INVALID_INPUT');
  }
  
  next();
};

// Validate alertId parameter (integer >= 1)
export const validateAlertId = (req, res, next) => {
  const { alertId } = req.params;
  
  if (!alertId) {
    throw new AppError('Alert ID is required', 400, 'INVALID_INPUT');
  }
  
  const alertIdNum = parseInt(alertId, 10);
  
  if (isNaN(alertIdNum) || alertIdNum < 1 || !Number.isInteger(alertIdNum)) {
    throw new AppError('Alert ID must be a positive integer', 400, 'INVALID_INPUT');
  }
  
  next();
};

// Validate historyId parameter (integer >= 1)
export const validateHistoryId = (req, res, next) => {
  const { historyId } = req.params;
  
  if (!historyId) {
    throw new AppError('History ID is required', 400, 'INVALID_INPUT');
  }
  
  const historyIdNum = parseInt(historyId, 10);
  
  if (isNaN(historyIdNum) || historyIdNum < 1 || !Number.isInteger(historyIdNum)) {
    throw new AppError('History ID must be a positive integer', 400, 'INVALID_INPUT');
  }
  
  next();
};

// Validate date format for report query params (from/to)
export const validateReportTimeRange = (req, res, next) => {
  const { from, to } = req.query;
  
  // Both from and to are optional
  if (!from && !to) {
    return next();
  }
  
  // ISO 8601 date format validation
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
  
  if (from) {
    if (!iso8601Regex.test(from)) {
      throw new AppError(
        'Invalid "from" date format. Must be ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)',
        400,
        'INVALID_INPUT'
      );
    }
    
    const fromDate = new Date(from);
    if (isNaN(fromDate.getTime())) {
      throw new AppError('Invalid "from" date value', 400, 'INVALID_INPUT');
    }
  }
  
  if (to) {
    if (!iso8601Regex.test(to)) {
      throw new AppError(
        'Invalid "to" date format. Must be ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)',
        400,
        'INVALID_INPUT'
      );
    }
    
    const toDate = new Date(to);
    if (isNaN(toDate.getTime())) {
      throw new AppError('Invalid "to" date value', 400, 'INVALID_INPUT');
    }
  }
  
  // Validate that from is before to
  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    if (fromDate >= toDate) {
      throw new AppError('"from" date must be before "to" date', 400, 'INVALID_INPUT');
    }
  }
  
  next();
};
