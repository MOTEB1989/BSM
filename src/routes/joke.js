import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getJoke } from "../controllers/jokeController.js";

const router = Router();

// GET /api/random-joke - Fetch a random joke
router.get("/", asyncHandler(getJoke));

export default router;
