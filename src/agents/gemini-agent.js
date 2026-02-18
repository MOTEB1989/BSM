import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppError } from "../utils/errors.js";
import { CircuitBreaker } from "../utils/circuitBreaker.js";
import logger from "../utils/logger.js";

export class GeminiAgent {
  constructor(apiKey) {
    this.name = "gemini-agent";
    this.provider = "Gemini";
    this.apiKey = apiKey;
    
    if (!apiKey) {
      throw new AppError("GEMINI_API_KEY is not configured", 503);
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });

    // Circuit Breaker لمنع الانهيار عند فشل API
    this.breaker = new CircuitBreaker(this.chat.bind(this), {
      failureThreshold: 5,
      resetTimeout: 60000,
      name: "gemini-api"
    });

    this.systemPrompt = `أنت مساعد ذكي متخصص في البنك والتقنية المالية. 
    تتحدث العربية والإنجليزية باحترافية. 
    قدم إجابات دقيقة ومختصرة مع التركيز على الأمان والامتثال.`;
  }

  async process(input, context = {}) {
    try {
      logger.info(`[${this.name}] Processing request`, { input: input.substring(0, 100) });
      
      const result = await this.breaker.execute(input, context);
      
      return {
        success: true,
        response: result,
        provider: this.provider,
        model: "gemini-2.0-flash-exp",
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`[${this.name}] Processing failed`, { error: error.message });
      throw new AppError(`Gemini processing failed: ${error.message}`, 503);
    }
  }

  async chat(message, context) {
    try {
      // بناء السياق التاريخي إذا وجد
      const history = context.history || [];
      
      const chat = this.model.startChat({
        history: history.map(msg => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: context.temperature || 0.7,
        }
      });

      const result = await chat.sendMessage(message);
      const response = result.response.text();

      return response;
    } catch (error) {
      if (error.message.includes("API key not valid")) {
        throw new AppError("Gemini API key is invalid", 401);
      }
      if (error.message.includes("quota")) {
        throw new AppError("Gemini rate limit exceeded", 429);
      }
      throw error;
    }
  }

  getStatus() {
    return {
      name: this.name,
      provider: this.provider,
      status: this.breaker.isOpen() ? "unhealthy" : "healthy",
      circuitBreaker: this.breaker.getState()
    };
  }
}
