// src/orbit/webhooks/telegram.js
import { telegramAgent } from "../agents/TelegramAgent.js";

const SECRET_TOKEN = process.env.TELEGRAM_WEBHOOK_SECRET;

export async function handleTelegramWebhook(req, res) {
  try {
    // التحقق من secret token
    if (SECRET_TOKEN) {
      const headerToken = req.headers["x-telegram-bot-api-secret-token"];
      if (headerToken !== SECRET_TOKEN) {
        return res.sendStatus(403);
      }
    }

    const update = req.body;
    if (!update) return res.sendStatus(200);

    const message = update.message || update.edited_message;
    if (!message) return res.sendStatus(200);

    const chatId = message.chat.id;
    const text = (message.text || "").trim();

    // قائمة المشرفين
    const admins = (process.env.ORBIT_ADMIN_CHAT_IDS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // أمر /run (للمشرفين فقط)
    if (text.startsWith("/run")) {
      if (!admins.includes(String(chatId))) {
        await telegramAgent.sendMessage(chatId, "🚫 ليس لديك صلاحية تنفيذ هذا الأمر.");
        return res.sendStatus(200);
      }

      const query = text.replace("/run", "").trim();
      if (!query) {
        await telegramAgent.sendMessage(chatId, "❗ استخدم: /run <السؤال أو الأمر>");
        return res.sendStatus(200);
      }

      await telegramAgent.sendMessage(chatId, `⏳ جاري تنفيذ: ${query}...`);
      // TODO: ربط بـ research agent
      await telegramAgent.sendMessage(chatId, `✅ تم استلام الطلب: ${query}`);
      return res.sendStatus(200);
    }

    // أوامر عامة
    if (text === "/help" || text === "/start") {
      await telegramAgent.sendMessage(chatId, "مرحبًا! أرسل /run <سؤالك> (للمشرفين فقط)");
      return res.sendStatus(200);
    }

    // رد افتراضي
    await telegramAgent.sendMessage(chatId, "تم استلام رسالتك. استخدم /help للمساعدة.");
    return res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    return res.sendStatus(500);
  }
}
