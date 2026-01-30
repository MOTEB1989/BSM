import { Router } from "express";
import { listKnowledge } from "../controllers/knowledgeController.js";

const router = Router();
router.get("/", listKnowledge);

export default router;
