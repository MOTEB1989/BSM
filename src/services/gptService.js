import fetch from "node-fetch";
import { AppError } from "../utils/errors.js";

const API_URL = "https://api.openai.com/v1/chat/completions";

export const runGPT = async ({ model, apiKey, system, user }) => {
  if (!apiKey) throw new AppError("Missing API key for model provider", 500, "MISSING_API_KEY");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model || process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      max_tokens: 1200
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new AppError(`GPT request failed: ${text}`, 500, "GPT_ERROR");
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
};
