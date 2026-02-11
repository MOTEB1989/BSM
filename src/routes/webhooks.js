import { Router } from "express";
import express from "express";
import { handleGitHubWebhook } from "../controllers/webhookController.js";
import { telegramWebhook } from "../webhooks/telegram.js";

const router = Router();

router.post("/github", handleGitHubWebhook);
router.post("/telegram", express.json(), telegramWebhook);

export default router;
