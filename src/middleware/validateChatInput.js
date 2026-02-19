import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";

/**
 * Chat Input Validation Middleware
 * 
 * Validates common chat input parameters:
 * - message: required string, non-empty, within length limit
 * - history: must be array
 * - language: must be 'ar' or 'en'
 * 
 * Eliminates duplicated validation logic across chat.js and ai-proxy.js
 */
export const validateChatInput = (req, res, next) => {
  try {
    const { message, history = [], language = "ar" } = req.body;

    // Validate message
    if (!message || typeof message !== "string" || !message.trim()) {
      throw new AppError("Message is required", 400, "INVALID_INPUT");
    }

    if (message.length > env.maxAgentInputLength) {
      throw new AppError("Message too long", 400, "INPUT_TOO_LONG");
    }

    // Validate history
    if (!Array.isArray(history)) {
      throw new AppError("History must be an array", 400, "INVALID_HISTORY");
    }

    // Validate language
    if (!["ar", "en"].includes(language)) {
      throw new AppError("Unsupported language", 400, "INVALID_LANGUAGE");
    }

    next();
  } catch (err) {
    next(err);
  }
};
