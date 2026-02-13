const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (value, fallback) => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return fallback;
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
  maxAgentInputLength: parseNumber(process.env.MAX_AGENT_INPUT_LENGTH, 4000),
  defaultModel: process.env.DEFAULT_MODEL || "gpt-4o-mini",
  modelRouterStrategy: process.env.MODEL_ROUTER_STRATEGY || "balanced",
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  fallbackEnabled: parseBoolean(process.env.FALLBACK_ENABLED, true),
  perplexityModel: process.env.PERPLEXITY_MODEL || "llama-3.1-sonar-large-128k-online",
  perplexityCitations: parseBoolean(process.env.PERPLEXITY_CITATIONS, true),
  perplexityRecencyDays: parseNumber(process.env.PERPLEXITY_RECENCY_DAYS, 7),
  
  // Feature flags
  mobileMode: parseBoolean(process.env.MOBILE_MODE, false),
  lanOnly: parseBoolean(process.env.LAN_ONLY, false),
  safeMode: parseBoolean(process.env.SAFE_MODE, false),
  
  // Security settings
  egressPolicy: process.env.EGRESS_POLICY || "deny_by_default",
  egressAllowedHosts: process.env.EGRESS_ALLOWED_HOSTS
    ? process.env.EGRESS_ALLOWED_HOSTS.split(",").map((host) => host.trim()).filter(Boolean)
    : ["api.openai.com", "github.com"]
};

// Validate admin token in production
if (env.nodeEnv === "production" && !env.adminToken) {
  throw new Error("ADMIN_TOKEN must be set in production");
}

if (env.nodeEnv === "production" && env.adminToken && env.adminToken.length < 16) {
  throw new Error("ADMIN_TOKEN must be at least 16 characters in production");
}

if (env.nodeEnv === "production" && !env.githubWebhookSecret) {
  throw new Error("GITHUB_WEBHOOK_SECRET must be set in production");
}

// Validate egress policy
if (!["allow_all", "deny_by_default", "deny_all"].includes(env.egressPolicy)) {
  throw new Error(`Invalid EGRESS_POLICY: ${env.egressPolicy}. Must be one of: allow_all, deny_by_default, deny_all`);
}

// Warn about insecure development settings in production
if (env.nodeEnv === "production") {
  if (env.adminToken === "change-me") {
    throw new Error("ADMIN_TOKEN cannot be 'change-me' in production");
  }
  if (!env.lanOnly && env.mobileMode) {
    console.warn("⚠️  WARNING: MOBILE_MODE is enabled without LAN_ONLY in production");
  }
  if (env.egressPolicy === "allow_all") {
    console.warn("⚠️  WARNING: EGRESS_POLICY=allow_all is not recommended in production");
  }
}
