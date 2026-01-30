import logger from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    logger.info({
      correlationId: req.correlationId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs
    });
  });

  next();
};
