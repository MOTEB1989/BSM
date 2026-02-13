import { Router } from "express";
import { triggerOrchestration } from "../controllers/orchestratorController.js";
import { getAllEventStrategies } from "../config/orchestratorEvents.js";

const router = Router();

/**
 * POST /orchestrator/run
 * Triggers the orchestration process which:
 * 1. Calls Architect agent for analysis
 * 2. Calls Runner agent for testing
 * 3. Calls Security agent for security checks
 * 4. Generates consolidated report
 */
router.post("/run", triggerOrchestration);

/**
 * GET /orchestrator/config
 * Returns the orchestrator event configuration
 */
router.get("/config", (req, res) => {
  const strategies = getAllEventStrategies();
  res.json({
    success: true,
    strategies,
    totalEvents: strategies.length,
    correlationId: req.correlationId
  });
});

export default router;
