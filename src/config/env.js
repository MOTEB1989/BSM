export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  logLevel: process.env.LOG_LEVEL || "info",
  adminToken: process.env.ADMIN_TOKEN
};

// Validate admin token in production
if (env.nodeEnv === "production" && !env.adminToken) {
  throw new Error("ADMIN_TOKEN must be set in production");
}

if (env.nodeEnv === "production" && env.adminToken && env.adminToken.length < 16) {
  throw new Error("ADMIN_TOKEN must be at least 16 characters in production");
}
