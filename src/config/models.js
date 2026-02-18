export const models = {
  openai: {
    bsm: process.env.OPENAI_BSM_KEY,
    bsu: process.env.OPENAI_BSU_KEY,
    brinder: process.env.OPENAI_BRINDER_KEY,
    lexnexus: process.env.OPENAI_LEXNEXUS_KEY,
    default: process.env.OPENAI_BSM_KEY || process.env.OPENAI_BSU_KEY || process.env.OPENAI_API_KEY
  },
  anthropic: {
    default: process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_KEY
  },
  google: {
    default: process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_KEY
  },
  azure: {
    default: process.env.AZURE_OPENAI_API_KEY
  },
  groq: {
    default: process.env.GROQ_API_KEY
  },
  cohere: {
    default: process.env.COHERE_API_KEY
  },
  mistral: {
    default: process.env.MISTRAL_API_KEY
  },
  perplexity: {
    default: process.env.PERPLEXITY_KEY || process.env.PERPLEXITY_API_KEY
  }
};

/**
 * Helper: get active providers summary
 */
export const getProviderStatus = () => {
  return Object.fromEntries(
    Object.entries(models).map(([name, keys]) => [
      name,
      Boolean(keys.default)
    ])
  );
};
