import { Router } from "express";
import { triggerOrchestration } from "../controllers/orchestratorController.js";

const router = Router();

/**
 * Backward-compatible control endpoint.
 * POST /api/control/run
 */
router.post("/run", triggerOrchestration);

export default router;
