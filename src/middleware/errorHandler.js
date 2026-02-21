import logger from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  // Map certain error codes to appropriate HTTP status codes
  const status = err.status || (err.code === "CIRCUIT_BREAKER_OPEN" ? 503 : 500);

  logger.error({
    correlationId: req.correlationId,
    message: err.message,
    code: err.code,
    stack: err.stack
  });

  // Provide clearer client-facing error messages
  let clientMessage = err.message;
  
  // Handle specific error codes with user-friendly messages
  if (err.code === "MISSING_API_KEY") {
    clientMessage = "AI service is not configured. Please contact the administrator.";
  } else if (err.code === "INVALID_API_KEY") {
    clientMessage = "AI service credentials are invalid. Please contact the administrator.";
  } else if (err.code === "NETWORK_ERROR") {
    clientMessage = "Cannot connect to AI service. Please check server network configuration.";
  } else if (err.code === "GPT_TIMEOUT" || err.code === "PROVIDER_TIMEOUT") {
    clientMessage = "AI service request timed out. Please try again.";
  } else if (err.code === "RATE_LIMITED") {
    clientMessage = "AI service rate limit exceeded. Please try again shortly.";
  } else if (err.code === "CIRCUIT_BREAKER_OPEN") {
    clientMessage = "AI service is temporarily unavailable due to repeated failures. Please try again shortly.";
  } else if (err.code === "ALL_PROVIDERS_FAILED" || err.code === "ALL_MODELS_FAILED") {
    clientMessage = err.message || "All AI providers failed. Please try again or contact the administrator.";
  } else if (err.code === "PROVIDER_ERROR") {
    clientMessage = "AI service returned an error. Please try again.";
  } else if (status === 500) {
    // For all other 500 errors, use generic message
    clientMessage = "Internal Server Error";
  }

  const payload = {
    error: clientMessage,
    code: err.code || "INTERNAL_ERROR",
    correlationId: req.correlationId
  };
  if (err.stderr !== undefined) payload.stderr = err.stderr;
  if (err.allowed !== undefined) payload.allowed = err.allowed;
  res.status(status).json(payload);
};
