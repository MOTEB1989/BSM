/**
 * Provider Utilities
 *
 * Centralizes AI provider selection logic used by chat routes and agent runner.
 * Eliminates duplication between buildAgentProviders and manual provider arrays.
 */

import { hasUsableApiKey } from "./apiKey.js";

const PROVIDER_ORDER = ["openai", "kimi", "perplexity", "anthropic"];

/**
 * Resolve API key for a provider/key combination
 */
const resolveProviderKey = (models, provider, keyName) => {
  const selectedKey = models[provider]?.[keyName];
  if (hasUsableApiKey(selectedKey)) return selectedKey;

  const fallbackKey = models[provider]?.default;
  return hasUsableApiKey(fallbackKey) ? fallbackKey : null;
};

/**
 * Build provider list for chat (priority order from available keys)
 * Used by chat routes and ai-proxy.
 *
 * @param {Object} models - Models config (from config/models.js)
 * @returns {Array<{ type: string, apiKey: string }>}
 */
export const buildChatProviders = (models) => {
  const providers = [];

  for (const provider of PROVIDER_ORDER) {
    const apiKey = resolveProviderKey(models, provider, "default");
    if (apiKey) {
      providers.push({ type: provider, apiKey });
    }
  }

  return providers;
};

/**
 * Build provider list for agent execution (preferred provider first, then fallbacks)
 * Used by agentRunner.
 *
 * @param {Object} models - Models config
 * @param {Object} agent - Agent config with modelProvider, modelKey
 * @returns {Array<{ type: string, apiKey: string }>}
 */
export const buildAgentProviders = (models, agent) => {
  const providers = [];
  const seen = new Set();

  const preferredProvider = agent.modelProvider || "openai";
  const preferredKeyName = agent.modelKey || "default";

  const preferredKey = resolveProviderKey(models, preferredProvider, preferredKeyName);
  if (preferredKey) {
    providers.push({ type: preferredProvider, apiKey: preferredKey });
    seen.add(preferredProvider);
  }

  for (const provider of PROVIDER_ORDER) {
    if (seen.has(provider)) continue;

    const apiKey = resolveProviderKey(models, provider, "default");
    if (apiKey) {
      providers.push({ type: provider, apiKey });
      seen.add(provider);
    }
  }

  return providers;
};
