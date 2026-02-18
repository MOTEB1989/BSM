import { Router } from "express";
import { getHealth, getHealthDetailed } from "../controllers/healthController.js";

const router = Router();
router.get("/", getHealth);
router.get("/detailed", getHealthDetailed);

export default router;
