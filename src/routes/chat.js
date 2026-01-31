import { Router } from "express";
import { runAgent } from "../runners/agentRunner.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { agentId, input } = req.body;
    const result = await runAgent({ agentId, input });
    res.json({ output: result.output });
  } catch (err) {
    next(err);
  }
});

export default router;
