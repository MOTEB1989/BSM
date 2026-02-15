import { Router } from "express";
import {
  evaluatePR,
  batchEvaluatePRs,
  getConfig,
  healthCheck
} from "../controllers/prOperationsController.js";

const router = Router();

// PR evaluation endpoints
router.post("/evaluate", evaluatePR);
router.post("/batch-evaluate", batchEvaluatePRs);

// Config and health
router.get("/config", getConfig);
router.get("/health", healthCheck);

export default router;
