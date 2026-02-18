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
  perplexity: {
    default: process.env.PERPLEXITY_KEY
  },
  kimi: {
    default: process.env.KIMI_API_KEY || process.env.KIM_API_KEY
  }
};
