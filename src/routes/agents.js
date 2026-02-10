import { Router } from "express";
import { listAgents, executeAgent } from "../controllers/agentsController.js";
import { 
  startAgent, 
  stopAgent, 
  getAgentsStatus, 
  getAgentStatus 
} from "../controllers/agentControl.js";

const router = Router();

router.get("/", listAgents);
router.post("/run", executeAgent);

// Agent control endpoints
router.post("/start/:agentId", startAgent);
router.post("/stop/:agentId", stopAgent);
router.get("/status", getAgentsStatus);
router.get("/:agentId/status", getAgentStatus);

export default router;
