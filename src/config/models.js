export const models = {
  openai: {
    bsm: process.env.OPENAI_BSM_KEY,
    bsu: process.env.OPENAI_BSU_KEY,
    brinder: process.env.OPENAI_BRINDER_KEY,
    lexnexus: process.env.OPENAI_LEXNEXUS_KEY,
    fallback: process.env.OPENAI_FALLBACK_KEY,
    default:
      process.env.OPENAI_BSM_KEY ||
      process.env.OPENAI_BSU_KEY ||
      process.env.OPENAI_LEXNEXUS_KEY ||
      process.env.OPENAI_BRINDER_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.OPENAI_FALLBACK_KEY
  },
  anthropic: {
    default: process.env.ANTHROPIC_API_KEY
  },
  perplexity: {
    default: process.env.PERPLEXITY_KEY || process.env.PERPLEXITY_API_KEY
  },
  google: {
    default: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  }
};
