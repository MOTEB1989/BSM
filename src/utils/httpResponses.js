/**
 * HTTP Response Utilities
 * Common response patterns to reduce duplication across controllers
 */

/**
 * Send a 400 Bad Request response with error message
 * @param {object} res - Express response object
 * @param {string} error - Error message
 * @param {string} [correlationId] - Optional correlation ID
 */
export function badRequest(res, error, correlationId) {
  return res.status(400).json({
    error,
    correlationId
  });
}

/**
 * Send a 401 Unauthorized response
 * @param {object} res - Express response object
 * @param {string} [error='Unauthorized'] - Error message
 */
export function unauthorized(res, error = 'Unauthorized') {
  return res.status(401).json({ error });
}

/**
 * Send a 403 Forbidden response
 * @param {object} res - Express response object
 * @param {string} [error='Forbidden'] - Error message
 * @param {string} [message] - Optional detailed message
 */
export function forbidden(res, error = 'Forbidden', message) {
  const response = { error };
  if (message) {
    response.message = message;
  }
  return res.status(403).json(response);
}

/**
 * Send a 404 Not Found response
 * @param {object} res - Express response object
 * @param {string} [error='Not Found'] - Error message
 */
export function notFound(res, error = 'Not Found') {
  return res.status(404).json({ error });
}

/**
 * Send a 500 Internal Server Error response
 * @param {object} res - Express response object
 * @param {string} [error='Internal Server Error'] - Error message
 * @param {string} [message] - Optional detailed message
 */
export function serverError(res, error = 'Internal Server Error', message) {
  const response = { error };
  if (message) {
    response.message = message;
  }
  return res.status(500).json(response);
}

/**
 * Send a success response with data
 * @param {object} res - Express response object
 * @param {object} data - Response data
 * @param {string} [correlationId] - Optional correlation ID
 */
export function success(res, data, correlationId) {
  const response = { ...data };
  if (correlationId) {
    response.correlationId = correlationId;
  }
  return res.json(response);
}
