import { Router } from "express";
import { listAgents, executeAgent } from "../controllers/agentsController.js";

const router = Router();

router.get("/", listAgents);
router.post("/run", executeAgent);

export default router;
