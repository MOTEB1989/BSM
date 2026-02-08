import { Router } from "express";
import health from "./health.js";
import agents from "./agents.js";
import knowledge from "./knowledge.js";
import admin from "./admin.js";
import chat from "./chat.js";
import orchestrator from "./orchestrator.js";
import webhooks from "./webhooks.js";

const router = Router();

router.use("/health", health);
router.use("/agents", agents);
router.use("/knowledge", knowledge);
router.use("/admin", admin);
router.use("/chat", chat);
router.use("/orchestrator", orchestrator);
router.use("/webhooks", webhooks);

export default router;
