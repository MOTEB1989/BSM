import type { AIProvider } from './types';
import { OpenAIClient } from './openai-client';
import { AnthropicClient } from './anthropic-client';
import { GoogleGeminiClient } from './gemini-client';
import { AzureOpenAIClient } from './azure-openai-client';
import { GroqClient } from './groq-client';
import { CohereClient } from './cohere-client';
import { MistralClient } from './mistral-client';
import { PerplexityClient } from './perplexity-client';

const PROVIDER_MAP: Record<string, () => AIProvider> = {
  openai: () => new OpenAIClient(),
  anthropic: () => new AnthropicClient(),
  gemini: () => new GoogleGeminiClient(),
  azure: () => new AzureOpenAIClient(),
  groq: () => new GroqClient(),
  cohere: () => new CohereClient(),
  mistral: () => new MistralClient(),
  perplexity: () => new PerplexityClient(),
};

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
      clients.push(new OpenAIClient());
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
