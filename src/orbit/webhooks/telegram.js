// src/orbit/webhooks/telegram.js
import { telegramAgent } from "../agents/TelegramAgent.js";
import { verifyTelegramSecret, extractTelegramMessage, isAdminChatId } from "../../utils/telegramUtils.js";
import { runAgent } from "../../runners/agentRunner.js";

const TELEGRAM_MAX_MESSAGE_LENGTH = 4000;

function truncateForTelegram(text) {
  if (!text || text.length <= TELEGRAM_MAX_MESSAGE_LENGTH) return text;
  return text.slice(0, TELEGRAM_MAX_MESSAGE_LENGTH - 3) + "...";
}

export async function handleTelegramWebhook(req, res) {
  try {
    // Verify secret token
    if (!verifyTelegramSecret(req, res)) {
      return; // Response already sent by verifyTelegramSecret
    }

    // Include edited messages for orbit webhook (legacy behavior)
    const parsed = extractTelegramMessage(req.body, true);
    if (!parsed) return res.sendStatus(200);
    
    const { chatId, text } = parsed;

    // /run command (admin only)
    if (text.startsWith("/run")) {
      if (!isAdminChatId(chatId)) {
        await telegramAgent.sendMessage(chatId, "🚫 ليس لديك صلاحية تنفيذ هذا الأمر.");
        return res.sendStatus(200);
      }

      const query = text.replace("/run", "").trim();
      if (!query) {
        await telegramAgent.sendMessage(chatId, "❗ استخدم: /run <السؤال أو الأمر>");
        return res.sendStatus(200);
      }

      await telegramAgent.sendMessage(chatId, `⏳ جاري تنفيذ: ${query}...`);
      try {
        const { output } = await runAgent({
          agentId: "agent-auto",
          input: query,
          payload: { source: "telegram", chatId }
        });
        const reply = truncateForTelegram(output || "لم يصل رد من الوكيل.");
        await telegramAgent.sendMessage(chatId, reply);
      } catch (err) {
        const errMsg = err.message || "فشل تنفيذ الطلب.";
        await telegramAgent.sendMessage(chatId, `❌ ${errMsg}`);
      }
      return res.sendStatus(200);
    }

    // General commands
    if (text === "/help" || text === "/start") {
      await telegramAgent.sendMessage(chatId, "مرحبًا! أرسل /run <سؤالك> (للمشرفين فقط)");
      return res.sendStatus(200);
    }

    // Default response
    await telegramAgent.sendMessage(chatId, "تم استلام رسالتك. استخدم /help للمساعدة.");
    return res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    return res.sendStatus(500);
  }
}
