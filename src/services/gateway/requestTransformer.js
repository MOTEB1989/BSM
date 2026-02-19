import fetch from 'node-fetch';
import logger from '../../utils/logger.js';
import { AppError } from '../../utils/errors.js';

const REQUEST_TIMEOUT_MS = 30000;

export class RequestTransformer {
  /**
   * Transform standardized request to provider-specific format
   */
  transformRequest(provider, standardRequest) {
    const { messages, model, temperature = 0.7, max_tokens = 1024, stream = false } = standardRequest;

    switch (provider.type) {
      case 'openai':
      case 'perplexity':
      case 'kimi':
        return this.transformToOpenAIFormat(messages, model, temperature, max_tokens, stream);
      
      case 'anthropic':
        return this.transformToAnthropicFormat(messages, model, temperature, max_tokens, stream);
      
      case 'google':
        return this.transformToGoogleFormat(messages, model, temperature, max_tokens);
      
      default:
        throw new AppError(`Unsupported provider type: ${provider.type}`, 400);
    }
  }

  transformToOpenAIFormat(messages, model, temperature, maxTokens, stream) {
    return {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream
    };
  }

  transformToAnthropicFormat(messages, model, temperature, maxTokens, stream) {
    // Anthropic uses separate system message
    const systemMessages = messages.filter(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    return {
      model,
      system: systemMessages.map(m => m.content).join('\n') || undefined,
      messages: conversationMessages,
      temperature,
      max_tokens: maxTokens,
      stream
    };
  }

  transformToGoogleFormat(messages, model, temperature, maxTokens) {
    // Google uses different message structure
    const parts = [];
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        // System messages become context
        parts.push({ text: `Context: ${msg.content}` });
      } else if (msg.role === 'user') {
        parts.push({ text: msg.content });
      } else if (msg.role === 'assistant') {
        parts.push({ text: msg.content });
      }
    }

    return {
      contents: [{ parts }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    };
  }

  /**
   * Transform provider-specific response to standardized format
   */
  transformResponse(provider, response) {
    switch (provider.type) {
      case 'openai':
      case 'perplexity':
      case 'kimi':
        return this.transformFromOpenAIFormat(response);
      
      case 'anthropic':
        return this.transformFromAnthropicFormat(response);
      
      case 'google':
        return this.transformFromGoogleFormat(response);
      
      default:
        throw new AppError(`Unsupported provider type: ${provider.type}`, 400);
    }
  }

  transformFromOpenAIFormat(response) {
    const choice = response.choices?.[0];
    if (!choice) {
      throw new AppError('No response from model', 500);
    }

    return {
      content: choice.message?.content || '',
      role: choice.message?.role || 'assistant',
      finish_reason: choice.finish_reason,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0
      }
    };
  }

  transformFromAnthropicFormat(response) {
    const content = response.content?.[0];
    if (!content) {
      throw new AppError('No response from model', 500);
    }

    return {
      content: content.text || '',
      role: response.role || 'assistant',
      finish_reason: response.stop_reason,
      usage: {
        prompt_tokens: response.usage?.input_tokens || 0,
        completion_tokens: response.usage?.output_tokens || 0,
        total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
      }
    };
  }

  transformFromGoogleFormat(response) {
    const candidate = response.candidates?.[0];
    if (!candidate) {
      throw new AppError('No response from model', 500);
    }

    const text = candidate.content?.parts?.[0]?.text || '';

    return {
      content: text,
      role: 'assistant',
      finish_reason: candidate.finishReason,
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata?.totalTokenCount || 0
      }
    };
  }

  /**
   * Make HTTP request to provider API
   */
  async makeRequest(provider, apiKey, requestBody) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const headers = this.getHeaders(provider, apiKey);
      const url = this.getUrl(provider, requestBody.model);

      // Don't log full URL with API keys for security
      const sanitizedUrl = provider.type === 'google' 
        ? provider.apiUrl 
        : url;
      logger.debug({ provider: provider.name, url: sanitizedUrl }, 'Making provider request');

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new AppError(
          `Provider request failed: ${response.statusText} - ${errorText}`,
          response.status,
          'PROVIDER_ERROR'
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new AppError('Provider request timeout', 504, 'TIMEOUT');
      }
      
      throw error;
    }
  }

  getHeaders(provider, apiKey) {
    const headers = {
      'Content-Type': 'application/json'
    };

    switch (provider.type) {
      case 'openai':
      case 'perplexity':
      case 'kimi':
        headers['Authorization'] = `Bearer ${apiKey}`;
        break;
      
      case 'anthropic':
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        break;
      
      case 'google':
        // Google uses API key in URL
        break;
    }

    return headers;
  }

  getUrl(provider, model) {
    if (provider.type === 'google') {
      // Google Gemini API requires API key in URL query parameter
      // Security note: This URL should never be logged in full
      const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
      return `${provider.apiUrl}?key=${apiKey}`;
    }

    return provider.apiUrl;
  }
}

export const requestTransformer = new RequestTransformer();
