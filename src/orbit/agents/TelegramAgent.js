// src/orbit/agents/TelegramAgent.js
import fetch from "node-fetch";

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

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return res.json();
  }
}

export const telegramAgent = new TelegramAgent();
export default telegramAgent;
