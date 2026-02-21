import { Router } from "express";
import { listAgents, executeAgent } from "../controllers/agentsController.js";
import { 
  startAgent, 
  stopAgent, 
  getAgentsStatus, 
  getAgentStatus 
} from "../controllers/agentControl.js";
import { adminAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", listAgents);
// Require admin authentication for agent execution to prevent unauthorized access
// to terminal_execution agents like raptor-agent and my-agent
router.post("/run", adminAuth, executeAgent);

// Agent control endpoints
router.post("/start/:agentId", startAgent);
router.post("/stop/:agentId", stopAgent);
router.get("/status", getAgentsStatus);
router.get("/:agentId/status", getAgentStatus);

// Agent health endpoint
router.get("/:agentId/health", asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  
  // Simple health check: verify agent exists in registry
  const { loadRegistry } = await import("../utils/registryCache.js");
  const registry = await loadRegistry();
  
  if (!registry || !registry.agents) {
    return res.status(503).json({ 
      status: "unhealthy", 
      message: "Registry unavailable" 
    });
  }
  
  const agent = registry.agents.find(a => a.id === agentId);
  if (!agent) {
    return res.status(404).json({ 
      status: "not_found", 
      message: `Agent "${agentId}" not found` 
    });
  }
  
  return res.json({ 
    status: "healthy",
    agentId: agent.id,
    name: agent.name,
    contexts: agent.contexts?.allowed || []
  });
}));

export default router;
