// src/orbit/webhooks/telegram.js
import { telegramAgent } from "../agents/TelegramAgent.js";
import { verifyTelegramSecret, extractTelegramMessage, isAdminChatId } from "../../utils/telegramUtils.js";
import { runChat } from "../../services/gptService.js";
import { models } from "../../config/models.js";
import { buildChatProviders } from "../../utils/providerUtils.js";
import {
  buildChatMessages,
  getDestinationSystemPrompt,
  formatOutput
} from "../../utils/messageFormatter.js";

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
        const providers = buildChatProviders(models);
        if (providers.length === 0) {
          await telegramAgent.sendMessage(chatId, "❌ لا توجد خدمة ذكاء اصطناعي مهيأة حاليًا.");
          return res.sendStatus(200);
        }

        const language = "ar";
        const systemPrompt = getDestinationSystemPrompt(language, "agent-auto");
        const messages = buildChatMessages(systemPrompt, [], query);

        const result = await runChat({
          system: systemPrompt,
          user: query,
          messages,
          providers
        });

        const output = formatOutput(result, language);
        await sendTelegramLongMessage(chatId, output);
      } catch (err) {
        console.error("Error executing /run command:", err);
        await telegramAgent.sendMessage(chatId, "❌ تعذر تنفيذ الطلب. حدث خطأ داخلي.");
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

const TELEGRAM_MESSAGE_LIMIT = 4000;
const TELEGRAM_CHUNK_DELAY_MS = 80; // Small delay to avoid hitting Telegram rate limits

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendTelegramLongMessage(chatId, text) {
function escapeTelegramMarkdown(text) {
  if (!text) return "";
  // Escape Telegram Markdown / MarkdownV2 special characters
  // See: https://core.telegram.org/bots/api#markdownv2-style
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

async function sendTelegramLongMessage(chatId, text) {
  const chunks = splitTelegramMessage(String(text ?? ""), TELEGRAM_MESSAGE_LIMIT);
  for (const chunk of chunks) {
    if (!chunk) continue;
    const safeChunk = escapeTelegramMarkdown(chunk);
    await telegramAgent.sendMessage(chatId, safeChunk);
    // Add a small delay between chunks to respect Telegram rate limits
    if (i < chunks.length - 1) {
      await delay(TELEGRAM_CHUNK_DELAY_MS);
    }
  }
}

function splitTelegramMessage(text, maxLen) {
  if (!text) return [""];
  if (text.length <= maxLen) return [text];

  const chunks = [];
  let remaining = text;

  while (remaining.length > maxLen) {
    let slice = remaining.slice(0, maxLen);

    const paragraphBreak = slice.lastIndexOf("\n\n");
    const lineBreak = slice.lastIndexOf("\n");
    const breakAt = Math.max(paragraphBreak, lineBreak);

    if (breakAt > Math.floor(maxLen * 0.5)) {
      slice = slice.slice(0, breakAt);
    }

    chunks.push(slice.trimEnd());
    remaining = remaining.slice(slice.length).trimStart();
  }

  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}
