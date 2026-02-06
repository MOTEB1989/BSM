import { Router } from "express";
import { adminAuth } from "../middleware/auth.js";
import { loadAgents } from "../services/agentsService.js";
import { loadKnowledgeIndex } from "../services/knowledgeService.js";

const router = Router();

router.use(adminAuth);

router.get("/agents", async (req, res, next) => {
  try {
    const agents = await loadAgents();
    res.json({ agents });
  } catch (err) {
    next(err);
  }
});

router.get("/knowledge", async (req, res, next) => {
  try {
    const docs = await loadKnowledgeIndex();
    res.json({ documents: docs });
  } catch (err) {
    next(err);
  }
});

export default router;
