import { Router } from "express";
import health from "./health.js";
import status from "./status.js";
import agents from "./agents.js";
import knowledge from "./knowledge.js";
import admin from "./admin.js";
import chat from "./chat.js";
import aiProxy from "./ai-proxy.js";
import orchestrator from "./orchestrator.js";
import webhooks from "./webhooks.js";
import emergency from "./emergency.js";
import control from "./control.js";
import pr from "./pr.js";
import agentExecutor from "./agent-executor.js";
import joke from "./joke.js";
import notifications from "./notifications.js";
import mcp from "./mcp.js";

const router = Router();

router.use("/health", health);
router.use("/", status); // Mount status at root for /api/status
router.use("/agents", agents);
router.use("/knowledge", knowledge);
router.use("/admin", admin);
router.use("/chat", chat);
router.use("/ai-proxy", aiProxy);
router.use("/orchestrator", orchestrator);
router.use("/control", control);
router.use("/webhooks", webhooks);
router.use("/emergency", emergency);
router.use("/pr", pr);
router.use("/agent", agentExecutor);
router.use("/random-joke", joke);
router.use("/notifications", notifications);
router.use("/mcp", mcp);

export default router;
