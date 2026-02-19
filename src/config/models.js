export const models = {
  openai: {
    bsm: process.env.OPENAI_BSM_KEY,
    bsu: process.env.OPENAI_BSU_KEY,
    brinder: process.env.OPENAI_BRINDER_KEY,
    lexnexus: process.env.OPENAI_LEXNEXUS_KEY,
    default: process.env.OPENAI_BSM_KEY || process.env.OPENAI_BSU_KEY || process.env.OPENAI_API_KEY
  },
  anthropic: {
    // Support both variable names for backward compatibility across environments
    default: process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_KEY
  },
  gemini: {
    default: process.env.GEMINI_API_KEY
  },
  perplexity: {
    default: process.env.PERPLEXITY_KEY
  },
  kimi: {
    default: process.env.KIMI_API_KEY || process.env.KIM_API_KEY
  },
  
  // ========== NEW: Groq ==========
  groq: {
    default: process.env.GROQ_API_KEY
  },
  
  // ========== NEW: Cohere ==========
  cohere: {
    default: process.env.COHERE_API_KEY
  },
  
  // ========== NEW: Mistral AI ==========
  mistral: {
    default: process.env.MISTRAL_API_KEY
  },
  
  // ========== NEW: Azure OpenAI ==========
  azure: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    key: process.env.AZURE_OPENAI_KEY,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4"
  }
};

/**
 * Check if a model provider is available
 * @param {string} provider - Provider name (openai, anthropic, gemini, etc.)
 * @returns {boolean} True if provider has valid API key
 */
export const isModelAvailable = (provider) => {
  const providerConfig = models[provider];
  if (!providerConfig) return false;
  
  // Azure has different structure
  if (provider === 'azure') {
    return !!(providerConfig.endpoint && providerConfig.key);
  }
  
  // Standard providers
  return !!providerConfig.default;
};

/**
 * Get list of available model providers
 * @returns {string[]} Array of available provider names
 */
export const getAvailableModels = () => {
  return Object.keys(models).filter(isModelAvailable);
};

/**
 * Get API key for a specific provider
 * @param {string} provider - Provider name
 * @returns {string|null} API key or null if not available
 */
export const getModelKey = (provider) => {
  const providerConfig = models[provider];
  if (!providerConfig) return null;
  
  if (provider === 'azure') {
    return providerConfig.key;
  }
  
  return providerConfig.default;
};
