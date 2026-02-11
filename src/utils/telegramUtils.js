/**
 * Shared Telegram Webhook Utilities
 * Common functions used by Telegram webhook handlers
 */

import { auditLogger } from "./auditLogger.js";

/**
 * Parse admin chat IDs from environment variable
 * @returns {string[]} Array of admin chat IDs
 */
export function getAdminChatIds() {
  return (process.env.ORBIT_ADMIN_CHAT_IDS || "")
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
}

/**
 * Verify Telegram webhook secret token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {boolean} True if valid or no secret set, false otherwise
 */
export function verifyTelegramSecret(req, res) {
  const SECRET_TOKEN = process.env.TELEGRAM_WEBHOOK_SECRET;
  
  if (!SECRET_TOKEN) {
    return true; // No secret configured, allow through
  }
  
  const header = req.headers["x-telegram-bot-api-secret-token"];
  if (header !== SECRET_TOKEN) {
    auditLogger.logAccessDenied({
      resource: "telegram_webhook",
      action: "webhook_call",
      reason: "Invalid secret token",
      user: "telegram:unknown",
      ip: "telegram",
      correlationId: req.correlationId
    });
    res.sendStatus(403);
    return false;
  }
  
  return true;
}

/**
 * Check if a chat ID is an admin
 * @param {string} chatId - Telegram chat ID
 * @returns {boolean} True if admin
 */
export function isAdminChatId(chatId) {
  const adminIds = getAdminChatIds();
  return adminIds.includes(String(chatId));
}

/**
 * Extract message text from Telegram update
 * @param {object} update - Telegram update object or body
 * @param {boolean} includeEdited - Whether to include edited_message (default: false)
 * @returns {{ chatId: string, text: string } | null} Object with chatId and text, or null if no valid message
 */
export function extractTelegramMessage(update, includeEdited = false) {
  let message;
  
  if (includeEdited) {
    // Support both message and edited_message (orbit webhook behavior)
    message = update?.message || update?.edited_message;
  } else {
    // Only support message (main webhook behavior)
    message = update?.message;
  }
  
  if (!message?.text) {
    return null;
  }
  
  return {
    chatId: String(message.chat.id),
    text: message.text.trim()
  };
}
