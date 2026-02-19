import { env } from "../config/env.js";

/**
 * Message Formatter Utilities
 * 
 * Centralizes message formatting logic for chat interfaces.
 * Eliminates duplication between chat.js and ai-proxy.js
 */

/**
 * Build chat messages array with system prompt and history
 * 
 * @param {string} systemPrompt - System prompt based on language
 * @param {Array} history - Conversation history
 * @param {string} currentMessage - Current user message
 * @returns {Array} Formatted messages array for AI API
 */
export const buildChatMessages = (systemPrompt, history, currentMessage) => {
  const messages = [
    { role: "system", content: systemPrompt }
  ];

  // Add conversation history (limit to last 20 messages for performance)
  const recentHistory = history.slice(-20);
  for (const msg of recentHistory) {
    if (
      msg &&
      typeof msg === "object" &&
      (msg.role === "user" || msg.role === "assistant")
    ) {
      messages.push({
        role: msg.role,
        content: String(msg.content).slice(0, env.maxAgentInputLength)
      });
    }
  }

  // Add current user message
  messages.push({ role: "user", content: currentMessage });

  return messages;
};

/**
 * Get system prompt based on language and platform
 * 
 * @param {string} language - Language code ('ar' or 'en')
 * @param {string} platform - Platform name (default: 'BSM')
 * @returns {string} Localized system prompt
 */
export const getSystemPrompt = (language, platform = "BSM") => {
  if (language === "ar") {
    return `أنت مساعد ذكي متطور من منصة ${platform}. أجب باللغة العربية بشكل احترافي ومفيد. ساعد المستخدمين في الأسئلة القانونية والتقنية والإدارية بكفاءة عالية.`;
  }
  return `You are an advanced AI assistant from ${platform} platform. Answer professionally and helpfully in English. Assist users with legal, technical, and administrative questions efficiently.`;
};

/**
 * Format output with fallback message
 * 
 * @param {string} result - AI response
 * @param {string} language - Language code for fallback message
 * @returns {string} Formatted output or fallback message
 */
export const formatOutput = (result, language) => {
  if (result !== null && result !== undefined && result !== "") {
    return result;
  }
  return language === "ar" ? "لم يتم استلام رد." : "No response received.";
};
