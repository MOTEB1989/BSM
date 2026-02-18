import { Router } from "express";
import express from "express";
import { handleGitHubWebhook } from "../controllers/webhookController.js";
import { telegramWebhook } from "../webhooks/telegram.js";
import { githubWebhookRateLimit } from "../middleware/webhookRateLimit.js";

const router = Router();

router.post("/github", githubWebhookRateLimit, handleGitHubWebhook);
router.post("/telegram", express.json(), telegramWebhook);

export default router;
