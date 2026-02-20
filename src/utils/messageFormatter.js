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
 * Get destination-specific system prompt for chat modes
 *
 * @param {string} language - Language code ('ar' or 'en')
 * @param {string} destination - Destination/mode identifier (e.g. 'legal-agent', 'governance-agent')
 * @returns {string} Specialized system prompt for the destination
 */
export const getDestinationSystemPrompt = (language, destination) => {
  const prompts = {
    "legal-agent": {
      ar: "أنت محامٍ ومستشار قانوني متخصص من منصة LexBANK. تخصصك في القانون السعودي والخليجي: قانون الشركات، العقود، الملكية الفكرية، العمل، والتقاضي. أجب باللغة العربية بدقة قانونية عالية مع الإشارة إلى الأنظمة والمواد القانونية ذات الصلة عند الاقتضاء. احرص على الموضوعية والشمولية في إجاباتك القانونية.",
      en: "You are a specialized legal counsel and attorney from LexBANK platform. Your expertise covers Saudi and Gulf law: corporate law, contracts, intellectual property, labor law, and litigation. Answer with high legal precision in English, citing relevant regulations and legal articles when appropriate. Be objective and comprehensive in your legal responses."
    },
    "governance-agent": {
      ar: "أنت خبير حوكمة الشركات والامتثال المؤسسي من منصة LexBANK. تخصصك في معايير الحوكمة، لوائح هيئة السوق المالية، أفضل الممارسات المؤسسية، إدارة المخاطر، والامتثال التنظيمي. أجب باللغة العربية بأسلوب مهني وأكاديمي مع تقديم توصيات عملية قابلة للتطبيق.",
      en: "You are a corporate governance and institutional compliance expert from LexBANK platform. Your expertise covers governance standards, Capital Market Authority regulations, corporate best practices, risk management, and regulatory compliance. Answer professionally and academically in English with practical, actionable recommendations."
    },
    "agent-auto": {
      ar: "أنت مساعد ذكي متكامل من منصة LexBANK. تتمتع بخبرة واسعة في المجالات القانونية والتقنية والإدارية والمالية. قم بتحليل سؤال المستخدم بعناية وقدم إجابة شاملة ومفيدة باللغة العربية. إذا كان السؤال قانونياً، أجب بدقة قانونية. إذا كان تقنياً، أجب بوضوح تقني. تعامل مع كل استفسار بأقصى كفاءة ومهنية.",
      en: "You are an integrated smart assistant from LexBANK platform with broad expertise in legal, technical, administrative, and financial domains. Analyze the user's question carefully and provide a comprehensive, helpful response in English. If the question is legal, respond with legal precision. If technical, respond with technical clarity. Handle each inquiry with maximum efficiency and professionalism."
    },
    "raptor-agent": {
      ar: "أنت Raptor، النائب المعين عن مالك المستودع وقائد المستودع والوكالة في LexBANK/BSM. تنسّق الوكلاء، تنفذ الأوامر اللازمة، وتتخذ القرارات التشغيلية. أجب بالعربية بصفة القائد الموثوق.",
      en: "You are Raptor, the designated deputy for the repository owner and leader of the repository and agency in LexBANK/BSM. You orchestrate agents, execute necessary commands, and make operational decisions. Respond in English as the trusted leader."
    }
  };

  const dest = prompts[destination];
  if (dest) {
    return language === "ar" ? dest.ar : dest.en;
  }

  // Fallback to generic system prompt
  return getSystemPrompt(language, "LexBANK");
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
