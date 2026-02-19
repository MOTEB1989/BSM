import type { AIProvider } from './types';
import { BaseMockAIClient } from './base-client';

/**
 * AI Client Factory
 * 
 * Creates AI provider clients dynamically without requiring separate class files.
 * Eliminates 9 boilerplate client classes (openai, anthropic, gemini, azure, groq, cohere, mistral, perplexity, kimi).
 */

// Supported provider names
const SUPPORTED_PROVIDERS = [
  'openai',
  'anthropic',
  'gemini',
  'azure',
  'groq',
  'cohere',
  'mistral',
  'perplexity',
  'kimi'
] as const;

type SupportedProvider = typeof SUPPORTED_PROVIDERS[number];

/**
 * Create an AI client instance for a given provider
 * @param provider Provider name
 * @returns AIProvider instance
 */
const createClient = (provider: SupportedProvider): AIProvider => {
  return new BaseMockAIClient(provider);
};

/**
 * Map provider names to client factory functions
 */
const PROVIDER_MAP: Record<string, () => AIProvider> = {};
SUPPORTED_PROVIDERS.forEach(provider => {
  PROVIDER_MAP[provider] = () => createClient(provider);
});

/**
 * API Client Factory
 * Creates and manages AI provider clients
 */
export class APIClientFactory {
  private readonly clients: AIProvider[];

  private constructor(clients: AIProvider[]) {
    this.clients = clients;
  }

  static fromProviders(enabledProviders: string[]): APIClientFactory {
    const clients = enabledProviders
      .map((provider) => PROVIDER_MAP[provider]?.())
      .filter((client): client is AIProvider => Boolean(client));

    if (clients.length === 0) {
      clients.push(createClient('openai'));
    }

    return new APIClientFactory(clients);
  }

  getPrimaryClient(): AIProvider {
    return this.clients[0];
  }

  getAllClients(): AIProvider[] {
    return [...this.clients];
  }
}
