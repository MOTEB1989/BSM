import rateLimit from "express-rate-limit";

/**
 * Shared rate limiter for GitHub webhook endpoints.
 * Reused across both `/webhook/github` and `/api/webhooks/github`
 * to avoid bypassing throttling via alternative paths.
 */
export const githubWebhookRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many webhook requests, please try again later"
});

