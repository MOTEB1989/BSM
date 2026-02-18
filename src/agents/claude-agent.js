import Anthropic from "@anthropic-ai/sdk";
import { AppError } from "../utils/errors.js";
import { CircuitBreaker } from "../utils/circuitBreaker.js";
import logger from "../utils/logger.js";

export class ClaudeAgent {
  constructor(apiKey) {
    this.name = "claude-agent";
    this.provider = "Claude";
    this.apiKey = apiKey;
    
    if (!apiKey) {
      throw new AppError("ANTHROPIC_API_KEY is not configured", 503);
    }

    this.client = new Anthropic({
      apiKey: apiKey,
    });

    this.model = "claude-3-5-sonnet-20241022";
    this.maxTokens = 4096;

    this.breaker = new CircuitBreaker(this.chat.bind(this), {
      failureThreshold: 5,
      resetTimeout: 60000,
      name: "claude-api"
    });

    this.systemPrompt = `أنت Claude، مساعد ذكي متخصص في التحليل القانوني والمالي العميق. 
    تتميز بالدقة والحذر في الإجابات القانونية والمالية.
    استخدم اللغة العربية الفصحى في الردود.`;
  }

  async process(input, context = {}) {
    try {
      logger.info(`[${this.name}] Processing request`, { input: input.substring(0, 100) });
      
      const result = await this.breaker.execute(input, context);
      
      return {
        success: true,
        response: result,
        provider: this.provider,
        model: this.model,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`[${this.name}] Processing failed`, { error: error.message });
      throw new AppError(`Claude processing failed: ${error.message}`, 503);
    }
  }

  async chat(message, context) {
    try {
      const messages = [];
      
      // إضافة السياق التاريخي إذا وجد
      if (context.history && context.history.length > 0) {
        messages.push(...context.history.map(msg => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content
        })));
      }
      
      messages.push({
        role: "user",
        content: message
      });

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: context.temperature || 0.7,
        system: this.systemPrompt,
        messages: messages
      });

      return response.content[0].text;
    } catch (error) {
      if (error.status === 401) {
        throw new AppError("Claude API key is invalid", 401);
      }
      if (error.status === 429) {
        throw new AppError("Claude rate limit exceeded", 429);
      }
      if (error.error?.type === "overloaded_error") {
        throw new AppError("Claude servers are currently overloaded", 503);
      }
      throw error;
    }
  }

  getStatus() {
    return {
      name: this.name,
      provider: this.provider,
      status: this.breaker.isOpen() ? "unhealthy" : "healthy",
      model: this.model,
      circuitBreaker: this.breaker.getState()
    };
  }
}
