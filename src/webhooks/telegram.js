import { orchestrator } from "../runners/orchestrator.js";
import { auditLogger } from "../utils/auditLogger.js";
import { telegramAgent } from "../orbit/agents/TelegramAgent.js";
import { buildTelegramStatusMessage } from "../services/telegramStatusService.js";
import logger from "../utils/logger.js";

const ADMIN_IDS = (process.env.ORBIT_ADMIN_CHAT_IDS || "")
  .split(",")
  .map(v => v.trim())
  .filter(Boolean);

const SECRET_TOKEN = process.env.TELEGRAM_WEBHOOK_SECRET;

/**
 * Telegram Webhook Handler
 * Governance-safe implementation that:
 * - Routes all execution through the Orchestrator
 * - Enforces admin-only access for /run and /status
 * - Enforces Mobile Mode restrictions
 * - Audits all actions
 */
export async function telegramWebhook(req, res) {
  try {
    // 1️⃣ Verify secret token (if set)
    if (SECRET_TOKEN) {
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
        return res.sendStatus(403);
      }
    }

    const message = req.body?.message;
    if (!message?.text) return res.sendStatus(200);

    const chatId = String(message.chat.id);
    const text = message.text.trim();

    logger.info({
      correlationId: req.correlationId,
      chatId,
      text
    }, "Telegram message received");

    // 2️⃣ /start & /help
    if (text === "/start" || text === "/help") {
      await reply(chatId,
        "🤖 BSM Bot\n\n" +
        "/run <agent> (admin only)\n" +
        "/status (admin only)"
      );
      return res.sendStatus(200);
    }

    const isAdmin = ADMIN_IDS.includes(chatId);

    // 3️⃣ /status (admin only)
    if (text === "/status") {
      if (!isAdmin) {
        auditLogger.logAccessDenied({
          resource: "telegram_status",
          action: "status",
          reason: "Not admin",
          user: `telegram:${chatId}`,
          ip: "telegram",
          correlationId: req.correlationId
        });
        await reply(chatId, "🚫 Unauthorized");
        return res.sendStatus(200);
      }

      const statusMessage = buildTelegramStatusMessage();
      await reply(chatId, statusMessage);
      return res.sendStatus(200);
    }

    // 4️⃣ /run <agent> (admin only)
    if (text.startsWith("/run")) {
      if (!isAdmin) {
        auditLogger.logAccessDenied({
          resource: "telegram_run",
          action: "run_agent",
          reason: "Not admin",
          user: `telegram:${chatId}`,
          ip: "telegram",
          correlationId: req.correlationId
        });
        await reply(chatId, "🚫 Unauthorized");
        return res.sendStatus(200);
      }

      const [, agentId] = text.split(" ");
      if (!agentId) {
        await reply(chatId, "❗ Usage: /run <agent-id>");
        return res.sendStatus(200);
      }

      // Audit the run request
      auditLogger.logAgentOperation({
        action: "telegram_run_request",
        agentId,
        success: true,
        user: `telegram:${chatId}`,
        ip: "telegram",
        correlationId: req.correlationId
      });

      logger.info({
        correlationId: req.correlationId,
        chatId,
        agentId
      }, "Telegram agent run request");

      // Route through orchestrator with mobile mode context
      // This ensures governance restrictions are applied
      try {
        await orchestrator({
          event: "telegram.agent_run",
          payload: {
            agentId,
            source: "telegram",
            chatId
          },
          context: {
            mode: "mobile",
            actor: `telegram:${chatId}`,
            ip: "telegram",
            correlationId: req.correlationId
          }
        });

        await reply(chatId, `⏳ Agent "${agentId}" triggered`);
      } catch (error) {
        logger.error({
          correlationId: req.correlationId,
          error,
          agentId,
          chatId
        }, "Agent execution failed");

        await reply(chatId, `❌ Failed to execute agent "${agentId}"`);
      }

      return res.sendStatus(200);
    }

    // Unknown command
    return res.sendStatus(200);
  } catch (err) {
    logger.error({
      correlationId: req.correlationId,
      error: err
    }, "Telegram webhook error");
    return res.sendStatus(500);
  }
}

/**
 * Reply to Telegram chat
 * @param {string} chatId - Chat ID
 * @param {string} text - Message text
 */
async function reply(chatId, text) {
  try {
    await telegramAgent.sendMessage(chatId, text);
    logger.info({ chatId }, "Telegram message sent");
  } catch (error) {
    logger.error({ chatId, error }, "Failed to send Telegram message");
  }
}
