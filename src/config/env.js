const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseNumber(process.env.PORT, 3000),
  logLevel: process.env.LOG_LEVEL || "info",
  adminToken: process.env.ADMIN_TOKEN,
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [],
  rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMax: parseNumber(process.env.RATE_LIMIT_MAX, 100),
  maxAgentInputLength: parseNumber(process.env.MAX_AGENT_INPUT_LENGTH, 4000)
};

// Validate admin token in production
if (env.nodeEnv === "production" && !env.adminToken) {
  throw new Error("ADMIN_TOKEN must be set in production");
}

if (env.nodeEnv === "production" && env.adminToken && env.adminToken.length < 16) {
  throw new Error("ADMIN_TOKEN must be at least 16 characters in production");
}
