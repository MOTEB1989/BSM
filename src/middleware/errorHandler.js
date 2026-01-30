import logger from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;

  logger.error({
    correlationId: req.correlationId,
    message: err.message,
    code: err.code,
    stack: err.stack
  });

  res.status(status).json({
    error: status === 500 ? "Internal Server Error" : err.message,
    code: err.code || "INTERNAL_ERROR",
    correlationId: req.correlationId
  });
};
