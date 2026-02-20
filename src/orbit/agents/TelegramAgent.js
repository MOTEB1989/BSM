// src/orbit/agents/TelegramAgent.js
import fetch from "node-fetch";
import logger from "../../utils/logger.js";
import { getCircuitBreaker } from "../../utils/circuitBreaker.js";

const TELEGRAM_REQUEST_TIMEOUT_MS = 15000;
const telegramCircuitBreaker = getCircuitBreaker("telegram-api", {
  failureThreshold: 5,
  resetTimeout: 30000
});

export class TelegramAgent {
  constructor() {
    this.id = "telegram-agent";
    this.name = "Telegram ORBIT Agent";
  }

  async sendMessage(chatId, text, options = {}) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set");

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const body = {
      chat_id: chatId,
      text,
      parse_mode: options.parse_mode || "Markdown",
    };

    return telegramCircuitBreaker.execute(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TELEGRAM_REQUEST_TIMEOUT_MS);

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal
        });

        const payload = await res.json();
        if (!res.ok || payload?.ok === false) {
          throw new Error(payload?.description || `Telegram API returned status ${res.status}`);
        }

        return payload;
      } catch (error) {
        if (error.name === "AbortError") {
          logger.error({ chatId }, "Telegram sendMessage timeout");
          throw new Error("Telegram request timeout");
        }
        logger.error({ chatId, error: error.message }, "Telegram sendMessage failed");
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }
}

export const telegramAgent = new TelegramAgent();
export default telegramAgent;
