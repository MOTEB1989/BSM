// src/orbit/webhooks/telegram.js
import { telegramAgent } from "../agents/TelegramAgent.js";
import { verifyTelegramSecret, extractTelegramMessage, isAdminChatId } from "../../utils/telegramUtils.js";
import { runAgent } from "../../runners/agentRunner.js";

const PRIMARY_RESEARCH_AGENT_ID = process.env.TELEGRAM_RESEARCH_AGENT_ID || "perplexity-agent";
const FALLBACK_RESEARCH_AGENT_ID = "legal-agent";
const MAX_TELEGRAM_REPLY_LENGTH = 3500;

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
      const payload = {
        source: "orbit_telegram_webhook",
        chatId
      };

      try {
        const { result, agentId } = await runResearchAgent(query, payload);
        const outputMessage = buildAgentOutputMessage(result?.output, agentId);
        await telegramAgent.sendMessage(chatId, outputMessage);
      } catch (agentError) {
        console.error("Research agent execution failed:", agentError);
        await telegramAgent.sendMessage(chatId, "❌ تعذر تنفيذ وكيل البحث الآن. حاول مرة أخرى لاحقًا.");
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

async function runResearchAgent(query, payload) {
  const primaryRun = () => runAgent({
    agentId: PRIMARY_RESEARCH_AGENT_ID,
    input: query,
    payload
  });

  try {
    const result = await primaryRun();
    return { result, agentId: PRIMARY_RESEARCH_AGENT_ID };
  } catch (primaryError) {
    if (PRIMARY_RESEARCH_AGENT_ID === FALLBACK_RESEARCH_AGENT_ID) {
      throw primaryError;
    }

    console.warn(
      `Primary research agent "${PRIMARY_RESEARCH_AGENT_ID}" failed. Falling back to "${FALLBACK_RESEARCH_AGENT_ID}".`,
      primaryError
    );

    const result = await runAgent({
      agentId: FALLBACK_RESEARCH_AGENT_ID,
      input: query,
      payload: {
        ...payload,
        fallbackFrom: PRIMARY_RESEARCH_AGENT_ID
      }
    });

    return { result, agentId: FALLBACK_RESEARCH_AGENT_ID };
  }
}

function buildAgentOutputMessage(output, agentId) {
  const normalizedOutput =
    typeof output === "string"
      ? output.trim()
      : JSON.stringify(output ?? "", null, 2);

  const safeOutput = escapeTelegramMarkdown(normalizedOutput || "لم يصل رد من وكيل البحث.");
  const trimmedOutput = safeOutput.length > MAX_TELEGRAM_REPLY_LENGTH
    ? `${safeOutput.slice(0, MAX_TELEGRAM_REPLY_LENGTH)}\n... تم اختصار الرد لطوله.`
    : safeOutput;

  return `✅ نتيجة البحث (${escapeTelegramMarkdown(agentId)}):\n${trimmedOutput}`;
}

function escapeTelegramMarkdown(text) {
  return String(text).replace(/([_*`\[])/g, "\\$1");
}
