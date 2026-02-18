import fetch from "node-fetch";
import { AppError } from "../utils/errors.js";
import { CircuitBreaker } from "../utils/circuitBreaker.js";
import logger from "../utils/logger.js";

export class PerplexityAgent {
  constructor(apiKey) {
    this.name = "perplexity-agent";
    this.provider = "Perplexity";
    this.apiKey = apiKey;
    this.endpoint = "https://api.perplexity.ai/chat/completions";
    
    if (!apiKey) {
      throw new AppError("PERPLEXITY_API_KEY is not configured", 503);
    }

    this.breaker = new CircuitBreaker(this.search.bind(this), {
      failureThreshold: 3,
      resetTimeout: 30000,
      name: "perplexity-api"
    });

    this.models = {
      fast: "llama-3.1-sonar-small-128k-online",
      balanced: "llama-3.1-sonar-large-128k-online",
      pro: "sonar-pro"
    };
  }

  async process(input, context = {}) {
    try {
      logger.info(`[${this.name}] Searching`, { query: input.substring(0, 100) });
      
      const result = await this.breaker.execute(input, context);
      
      return {
        success: true,
        response: result.content,
        citations: result.citations || [],
        provider: this.provider,
        model: context.model || this.models.balanced,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`[${this.name}] Search failed`, { error: error.message });
      throw new AppError(`Perplexity search failed: ${error.message}`, 503);
    }
  }

  async search(query, context) {
    const model = context.model || this.models.balanced;
    
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: "أنت مساعد بحث متخصص في المعلومات المالية والتقنية. قدم إجابات دقيقة مع ذكر المصادر."
            },
            {
              role: "user",
              content: query
            }
          ],
          temperature: 0.2,
          top_p: 0.9,
          search_domain_filter: ["perplexity.ai"],
          return_images: false,
          return_related_questions: true,
          search_recency_filter: "month",
          top_k: 0,
          stream: false,
          presence_penalty: 0,
          frequency_penalty: 1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          throw new AppError("Perplexity API key is invalid", 401);
        }
        if (response.status === 429) {
          throw new AppError("Perplexity rate limit exceeded", 429);
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        citations: data.citations || [],
        usage: data.usage
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Perplexity API error: ${error.message}`);
    }
  }

  getStatus() {
    return {
      name: this.name,
      provider: this.provider,
      status: this.breaker.isOpen() ? "unhealthy" : "healthy",
      models: Object.keys(this.models),
      circuitBreaker: this.breaker.getState()
    };
  }
}
