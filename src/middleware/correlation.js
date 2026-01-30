import { randomUUID } from "crypto";

export const correlationMiddleware = (req, res, next) => {
  const id = req.headers["x-correlation-id"] || randomUUID();
  req.correlationId = id;
  res.setHeader("x-correlation-id", id);
  next();
};
