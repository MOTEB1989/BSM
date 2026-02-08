import { OpenAIClient } from '../../src/api/openai-client';
import { AnthropicClient } from '../../src/api/anthropic-client';
import { GoogleGeminiClient } from '../../src/api/gemini-client';
import { AzureOpenAIClient } from '../../src/api/azure-openai-client';
import { GroqClient } from '../../src/api/groq-client';
import { CohereClient } from '../../src/api/cohere-client';
import { MistralClient } from '../../src/api/mistral-client';
import { PerplexityClient } from '../../src/api/perplexity-client';
import type { AIProvider, ReportParams, ReportResult } from '../../src/api/types';

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

export type { AIProvider, ReportParams, ReportResult };

export class APIClientFactory {
  private readonly providers: AIProvider[];

  private constructor(providers: AIProvider[]) {
    this.providers = providers;
  }

  static fromProviders(enabledProviders: string[]): APIClientFactory {
    const providers = enabledProviders
      .map((providerName) => PROVIDER_MAP[providerName]?.())
      .filter((provider): provider is AIProvider => Boolean(provider));

    return new APIClientFactory(providers.length > 0 ? providers : [new OpenAIClient()]);
  }

  getPrimaryClient(): AIProvider {
    return this.providers[0];
  }
}

export function getEnabledProviders(): string[] {
  const env = process.env;
  return [
    env.OPENAI_API_KEY ? 'openai' : null,
    env.ANTHROPIC_API_KEY ? 'anthropic' : null,
    env.GOOGLE_API_KEY ? 'gemini' : null,
    env.AZURE_OPENAI_API_KEY ? 'azure' : null,
    env.GROQ_API_KEY ? 'groq' : null,
    env.COHERE_API_KEY ? 'cohere' : null,
    env.MISTRAL_API_KEY ? 'mistral' : null,
    env.PERPLEXITY_API_KEY ? 'perplexity' : null,
  ].filter((provider): provider is string => Boolean(provider));
}
