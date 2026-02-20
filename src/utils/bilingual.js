/**
 * Bilingual Support Utilities
 * 
 * Provides comprehensive Arabic/English bilingual support for the BSM platform:
 * - System prompts in both languages
 * - Error messages translation
 * - Response formatting
 * - RTL/LTR detection
 * - Language-aware routing
 * 
 * @module utils/bilingual
 */

/**
 * System prompts for AI agents in both languages
 */
export const systemPrompts = {
  // Default system prompt
  default: {
    ar: `أنت مساعد ذكاء اصطناعي متقدم من منصة BSM/LexBANK.
مهمتك مساعدة المستخدمين بشكل احترافي ودقيق.
التزم بأعلى معايير الأمان والخصوصية وفقاً لمعايير ساما.
استخدم اللغة العربية الفصحى الواضحة والمهنية.`,
    en: `You are an advanced AI assistant from the BSM/LexBANK platform.
Your mission is to help users professionally and accurately.
Adhere to the highest security and privacy standards according to SAMA regulations.
Use clear and professional language.`
  },

  // Legal agent
  legal: {
    ar: `أنت محامٍ خبير متخصص في القانون السعودي والدولي.
قدم استشارات قانونية دقيقة مع الإشارة إلى المصادر القانونية.
التزم بأخلاقيات المهنة القانونية ومعايير ساما.
استخدم المصطلحات القانونية الدقيقة باللغة العربية.`,
    en: `You are an expert lawyer specializing in Saudi and international law.
Provide accurate legal advice with references to legal sources.
Adhere to legal professional ethics and SAMA standards.
Use precise legal terminology.`
  },

  // Governance agent
  governance: {
    ar: `أنت خبير في الحوكمة المؤسسية ومعايير الامتثال.
قدم توصيات للحوكمة وفقاً لأفضل الممارسات الدولية ومعايير ساما.
ركز على الشفافية والمساءلة وحماية أصحاب المصلحة.
استخدم لغة مهنية واضحة تناسب صناع القرار.`,
    en: `You are an expert in corporate governance and compliance standards.
Provide governance recommendations according to international best practices and SAMA standards.
Focus on transparency, accountability, and stakeholder protection.
Use clear professional language suitable for decision-makers.`
  },

  // Code review agent
  codeReview: {
    ar: `أنت مهندس برمجيات خبير متخصص في مراجعة الكود.
راجع الكود بدقة من حيث الأمان والأداء والجودة.
اتبع معايير SOLID وDRY وKISS.
قدم ملاحظات بناءة مع أمثلة عملية للتحسين.`,
    en: `You are an expert software engineer specializing in code review.
Review code carefully for security, performance, and quality.
Follow SOLID, DRY, and KISS principles.
Provide constructive feedback with practical examples for improvement.`
  },

  // Gemini agent
  gemini: {
    ar: `أنت نموذج Gemini من Google، متخصص في فهم اللغة العربية والمحادثات الإبداعية.
تتميز بقدرات قوية في التفكير المنطقي والإجابة على الأسئلة العامة.
استخدم قدراتك المتعددة الوسائط لتقديم إجابات شاملة ومفيدة.`,
    en: `You are Google's Gemini model, specialized in Arabic language understanding and creative conversations.
You have strong reasoning capabilities and excel at answering general questions.
Use your multimodal capabilities to provide comprehensive and helpful answers.`
  },

  // Claude agent
  claude: {
    ar: `أنت Claude من Anthropic، متخصص في التحليل العميق والتفكير الأخلاقي.
قدم إجابات مدروسة وشاملة مع مراعاة الجوانب الأخلاقية.
التزم بمبادئ الأمان والمساعدة الصادقة والضرر الأقل.`,
    en: `You are Claude from Anthropic, specialized in deep analysis and ethical reasoning.
Provide thoughtful and comprehensive answers considering ethical aspects.
Adhere to principles of safety, honest assistance, and minimal harm.`
  },

  // Perplexity agent
  perplexity: {
    ar: `أنت محرك بحث ذكي من Perplexity AI متخصص في البحث الفوري والاستشهادات الدقيقة.
ابحث في الإنترنت وقدم إجابات محدثة مع مصادر موثوقة.
قدم استشهادات دقيقة لجميع المعلومات المقدمة.`,
    en: `You are an intelligent search engine from Perplexity AI specialized in real-time search and accurate citations.
Search the internet and provide up-to-date answers with reliable sources.
Provide accurate citations for all information presented.`
  },

  // Kimi agent
  kimi: {
    ar: `أنت Kimi من Moonshot AI، متخصص في معالجة النصوص الطويلة جداً.
يمكنك قراءة وتحليل وثائق ضخمة (200K+ tokens).
قدم ملخصات دقيقة وتحليلات شاملة للنصوص الطويلة.`,
    en: `You are Kimi from Moonshot AI, specialized in processing ultra-long texts.
You can read and analyze massive documents (200K+ tokens).
Provide accurate summaries and comprehensive analysis of long texts.`
  }
};

/**
 * Error messages in both languages
 */
export const errorMessages = {
  // Authentication errors
  unauthorized: {
    ar: 'غير مصرح - يرجى تسجيل الدخول',
    en: 'Unauthorized - Please log in'
  },
  invalidToken: {
    ar: 'رمز غير صالح أو منتهي الصلاحية',
    en: 'Invalid or expired token'
  },
  insufficientPermissions: {
    ar: 'صلاحيات غير كافية لهذه العملية',
    en: 'Insufficient permissions for this operation'
  },

  // Validation errors
  invalidInput: {
    ar: 'مدخلات غير صالحة - يرجى التحقق من البيانات',
    en: 'Invalid input - Please check your data'
  },
  missingRequired: {
    ar: 'حقول مطلوبة مفقودة',
    en: 'Missing required fields'
  },
  invalidFormat: {
    ar: 'تنسيق غير صالح',
    en: 'Invalid format'
  },

  // Service errors
  serviceUnavailable: {
    ar: 'الخدمة غير متاحة حالياً - يرجى المحاولة لاحقاً',
    en: 'Service unavailable - Please try again later'
  },
  apiKeyMissing: {
    ar: 'مفتاح API مفقود أو غير صالح',
    en: 'API key missing or invalid'
  },
  rateLimitExceeded: {
    ar: 'تجاوزت الحد المسموح من الطلبات - يرجى الانتظار',
    en: 'Rate limit exceeded - Please wait'
  },

  // Agent errors
  agentNotFound: {
    ar: 'الوكيل غير موجود',
    en: 'Agent not found'
  },
  agentExecutionFailed: {
    ar: 'فشل تنفيذ الوكيل',
    en: 'Agent execution failed'
  },

  // SAMA compliance errors
  dataResidencyViolation: {
    ar: 'مخالفة لمتطلبات إقامة البيانات - لا يمكن نقل البيانات خارج المناطق المسموحة',
    en: 'Data residency violation - Data cannot be transferred outside allowed regions'
  },
  complianceViolation: {
    ar: 'مخالفة للامتثال لمعايير ساما',
    en: 'SAMA compliance violation'
  }
};

/**
 * Success messages in both languages
 */
export const successMessages = {
  operationSuccessful: {
    ar: 'تمت العملية بنجاح',
    en: 'Operation completed successfully'
  },
  dataUpdated: {
    ar: 'تم تحديث البيانات بنجاح',
    en: 'Data updated successfully'
  },
  agentExecuted: {
    ar: 'تم تنفيذ الوكيل بنجاح',
    en: 'Agent executed successfully'
  }
};

/**
 * Get localized message
 * 
 * @param {Object} messageObj - Message object with ar/en properties
 * @param {string} language - Language code ('ar' or 'en')
 * @returns {string} Localized message
 */
export function getLocalizedMessage(messageObj, language = 'ar') {
  if (!messageObj) return '';
  
  const lang = language.toLowerCase();
  return messageObj[lang] || messageObj.en || messageObj.ar || '';
}

/**
 * Get system prompt for agent
 * 
 * @param {string} agentType - Agent type (default, legal, governance, etc.)
 * @param {string} language - Language code ('ar' or 'en')
 * @returns {string} System prompt
 */
export function getSystemPrompt(agentType = 'default', language = 'ar') {
  const prompts = systemPrompts[agentType] || systemPrompts.default;
  return getLocalizedMessage(prompts, language);
}

/**
 * Detect language from text
 * 
 * @param {string} text - Text to analyze
 * @returns {string} Detected language ('ar' or 'en')
 */
export function detectLanguage(text) {
  if (!text) return 'ar'; // Default to Arabic

  // Check for Arabic characters
  const arabicRegex = /[\u0600-\u06FF]/;
  const hasArabic = arabicRegex.test(text);

  // Check for English characters
  const englishRegex = /[a-zA-Z]/;
  const hasEnglish = englishRegex.test(text);

  // If both, determine majority
  if (hasArabic && hasEnglish) {
    const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const englishCount = (text.match(/[a-zA-Z]/g) || []).length;
    return arabicCount > englishCount ? 'ar' : 'en';
  }

  return hasArabic ? 'ar' : 'en';
}

/**
 * Format response with bilingual support
 * 
 * @param {Object} data - Response data
 * @param {string} language - Language code
 * @returns {Object} Formatted response
 */
export function formatBilingualResponse(data, language = 'ar') {
  const isArabic = language === 'ar';

  return {
    ...data,
    language,
    direction: isArabic ? 'rtl' : 'ltr',
    locale: isArabic ? 'ar-SA' : 'en-US',
    timestamp: new Date().toISOString()
  };
}

/**
 * Get localized error response
 * 
 * @param {string} errorType - Error type key
 * @param {string} language - Language code
 * @param {Object} additionalData - Additional error data
 * @returns {Object} Error response
 */
export function getErrorResponse(errorType, language = 'ar', additionalData = {}) {
  const message = errorMessages[errorType] || errorMessages.invalidInput;

  return {
    error: true,
    message: getLocalizedMessage(message, language),
    errorType,
    language,
    direction: language === 'ar' ? 'rtl' : 'ltr',
    ...additionalData
  };
}

/**
 * Get localized success response
 * 
 * @param {string} messageType - Message type key
 * @param {string} language - Language code
 * @param {Object} data - Response data
 * @returns {Object} Success response
 */
export function getSuccessResponse(messageType, language = 'ar', data = {}) {
  const message = successMessages[messageType] || successMessages.operationSuccessful;

  return {
    success: true,
    message: getLocalizedMessage(message, language),
    language,
    direction: language === 'ar' ? 'rtl' : 'ltr',
    ...data
  };
}

/**
 * Translate agent name
 */
export const agentNames = {
  'gemini-agent': {
    ar: 'وكيل جيميني',
    en: 'Gemini Agent'
  },
  'claude-agent': {
    ar: 'وكيل كلود',
    en: 'Claude Agent'
  },
  'gpt-agent': {
    ar: 'وكيل GPT',
    en: 'GPT Agent'
  },
  'perplexity-agent': {
    ar: 'وكيل البحث',
    en: 'Search Agent'
  },
  'kimi-agent': {
    ar: 'وكيل كيمي',
    en: 'Kimi Agent'
  },
  'legal-agent': {
    ar: 'الوكيل القانوني',
    en: 'Legal Agent'
  },
  'governance-agent': {
    ar: 'وكيل الحوكمة',
    en: 'Governance Agent'
  },
  'code-review-agent': {
    ar: 'وكيل مراجعة الكود',
    en: 'Code Review Agent'
  }
};

/**
 * Get localized agent name
 * 
 * @param {string} agentId - Agent ID
 * @param {string} language - Language code
 * @returns {string} Localized agent name
 */
export function getAgentName(agentId, language = 'ar') {
  const names = agentNames[agentId];
  if (!names) return agentId;
  
  return getLocalizedMessage(names, language);
}

/**
 * Export all bilingual utilities
 */
export default {
  systemPrompts,
  errorMessages,
  successMessages,
  agentNames,
  getLocalizedMessage,
  getSystemPrompt,
  detectLanguage,
  formatBilingualResponse,
  getErrorResponse,
  getSuccessResponse,
  getAgentName
};
