# PR #17 Action Checklist
## Implementation Recommendations

**Date:** 2026-02-19  
**PR:** Add Gemini, Perplexity, and Claude AI Agents  
**Status:** ✅ Approved - Optional improvements below

---

## Priority 1: MUST DO (Before Production)

### None ✅
All critical requirements met. PR is production-ready.

---

## Priority 2: SHOULD DO (Next Sprint)

### 1. Add Unit Tests for Agent Classes
**Effort:** ~4 hours  
**Impact:** High (testing coverage)  
**Assignee:** TBD

**Files to create:**
- `test/agents/gemini-agent.test.js`
- `test/agents/perplexity-agent.test.js`
- `test/agents/claude-agent.test.js`

**Test cases to cover:**

```javascript
// test/agents/gemini-agent.test.js
import { GeminiAgent } from '../../src/agents/gemini-agent.js';
import { AppError } from '../../src/utils/errors.js';

describe('GeminiAgent', () => {
  describe('Constructor', () => {
    it('should throw error when API key is missing', () => {
      expect(() => new GeminiAgent()).toThrow(AppError);
      expect(() => new GeminiAgent()).toThrow('GEMINI_API_KEY is not configured');
    });

    it('should initialize with valid API key', () => {
      const agent = new GeminiAgent('test-key-123');
      expect(agent.name).toBe('gemini-agent');
      expect(agent.provider).toBe('Gemini');
    });

    it('should create circuit breaker with correct config', () => {
      const agent = new GeminiAgent('test-key');
      expect(agent.breaker).toBeDefined();
      expect(agent.breaker.failureThreshold).toBe(5);
      expect(agent.breaker.resetTimeout).toBe(60000);
    });
  });

  describe('process()', () => {
    let agent;

    beforeEach(() => {
      agent = new GeminiAgent('test-key');
    });

    it('should return success response with valid input', async () => {
      // Mock the chat method
      agent.chat = jest.fn().mockResolvedValue('Test response');
      
      const result = await agent.process('Hello', {});
      
      expect(result.success).toBe(true);
      expect(result.response).toBe('Test response');
      expect(result.provider).toBe('Gemini');
      expect(result.model).toBe('gemini-2.0-flash-exp');
    });

    it('should handle API errors gracefully', async () => {
      agent.chat = jest.fn().mockRejectedValue(new Error('API error'));
      
      await expect(agent.process('Hello', {})).rejects.toThrow(AppError);
      await expect(agent.process('Hello', {})).rejects.toThrow('Gemini processing failed');
    });

    it('should validate input length', async () => {
      const longInput = 'a'.repeat(10001);
      await expect(agent.process(longInput, {})).rejects.toThrow('Input too long');
    });
  });

  describe('chat()', () => {
    let agent;

    beforeEach(() => {
      agent = new GeminiAgent('test-key');
    });

    it('should handle invalid API key error', async () => {
      agent.model.startChat = jest.fn().mockImplementation(() => ({
        sendMessage: jest.fn().mockRejectedValue(new Error('API key not valid'))
      }));

      await expect(agent.chat('Hello', {})).rejects.toThrow('Gemini API key is invalid');
      await expect(agent.chat('Hello', {})).rejects.toThrow(AppError);
    });

    it('should handle quota exceeded error', async () => {
      agent.model.startChat = jest.fn().mockImplementation(() => ({
        sendMessage: jest.fn().mockRejectedValue(new Error('quota exceeded'))
      }));

      await expect(agent.chat('Hello', {})).rejects.toThrow('Gemini rate limit exceeded');
      await expect(agent.chat('Hello', {})).rejects.toThrow(AppError);
    });

    it('should include conversation history', async () => {
      const mockStartChat = jest.fn().mockReturnValue({
        sendMessage: jest.fn().mockResolvedValue({
          response: { text: () => 'Response' }
        })
      });
      agent.model.startChat = mockStartChat;

      const history = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' }
      ];

      await agent.chat('How are you?', { history });

      expect(mockStartChat).toHaveBeenCalledWith({
        history: [
          { role: 'user', parts: [{ text: 'Hello' }] },
          { role: 'model', parts: [{ text: 'Hi there' }] }
        ],
        generationConfig: { temperature: 0.7 }
      });
    });
  });

  describe('getStatus()', () => {
    it('should return healthy status when circuit closed', () => {
      const agent = new GeminiAgent('test-key');
      const status = agent.getStatus();
      
      expect(status.name).toBe('gemini-agent');
      expect(status.provider).toBe('Gemini');
      expect(status.status).toBe('healthy');
      expect(status.circuitBreaker.state).toBe('CLOSED');
    });

    it('should return unhealthy when circuit open', () => {
      const agent = new GeminiAgent('test-key');
      agent.breaker.state = 'OPEN';
      
      const status = agent.getStatus();
      expect(status.status).toBe('unhealthy');
    });
  });
});
```

**Similar tests needed for:**
- `perplexity-agent.test.js` (with model selection tests)
- `claude-agent.test.js` (with temperature tests)

---

### 2. Add Request Timeouts to API Calls
**Effort:** ~2 hours  
**Impact:** High (prevents hanging requests)  
**Assignee:** TBD

**Files to modify:**
- `src/agents/perplexity-agent.js`
- `src/agents/claude-agent.js`
- `src/agents/gemini-agent.js` (if needed)

**Implementation:**

```javascript
// src/agents/perplexity-agent.js
async search(query, context) {
  const model = context.model || this.models.balanced;
  
  // Add timeout configuration
  const TIMEOUT_MS = 30000; // 30 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const response = await fetch(this.endpoint, {
      method: "POST",
      signal: controller.signal, // Add abort signal
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ /* ... existing body ... */ })
    });

    clearTimeout(timeoutId); // Clear timeout on success

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
    clearTimeout(timeoutId); // Ensure timeout is cleared
    
    // Handle abort specifically
    if (error.name === 'AbortError') {
      throw new AppError("Request timeout - Perplexity API took too long to respond", 504);
    }
    
    if (error instanceof AppError) throw error;
    throw new Error(`Perplexity API error: ${error.message}`);
  }
}
```

**Configuration approach (recommended):**

```javascript
// src/config/agents.js
export const AGENT_CONFIG = {
  gemini: {
    timeout: 30000,
    failureThreshold: 5,
    resetTimeout: 60000
  },
  perplexity: {
    timeout: 30000,
    failureThreshold: 3,
    resetTimeout: 30000
  },
  claude: {
    timeout: 45000, // Claude can be slower
    failureThreshold: 5,
    resetTimeout: 60000
  }
};
```

---

### 3. Add Input Length Validation in Agents
**Effort:** ~1 hour  
**Impact:** Medium (security hardening)  
**Assignee:** TBD

**Files to modify:**
- `src/agents/gemini-agent.js`
- `src/agents/perplexity-agent.js`
- `src/agents/claude-agent.js`

**Implementation:**

```javascript
// Add constant at top of each agent file
const MAX_INPUT_LENGTH = 10000; // 10K characters

// In process() method of each agent
async process(input, context = {}) {
  // Validate input length
  if (!input || typeof input !== 'string') {
    throw new AppError("Invalid input: must be a non-empty string", 400, "INVALID_INPUT");
  }
  
  if (input.length > MAX_INPUT_LENGTH) {
    throw new AppError(
      `Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`,
      400,
      "INPUT_TOO_LONG"
    );
  }

  try {
    logger.info(`[${this.name}] Processing request`, { 
      inputLength: input.length,
      hasHistory: !!(context.history && context.history.length)
    });
    
    const result = await this.breaker.execute(input, context);
    
    return {
      success: true,
      response: result,
      provider: this.provider,
      model: this.model || "gemini-2.0-flash-exp",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`[${this.name}] Processing failed`, { 
      error: error.message,
      inputLength: input.length 
    });
    throw new AppError(`${this.provider} processing failed: ${error.message}`, 503);
  }
}
```

---

## Priority 3: NICE TO HAVE (Future PRs)

### 4. Extract Common Error Handling to Base Class
**Effort:** ~3 hours  
**Impact:** Low (code maintainability)  
**Assignee:** TBD

**Create base agent class:**

```javascript
// src/agents/base-agent.js
import { AppError } from "../utils/errors.js";
import { CircuitBreaker } from "../utils/circuitBreaker.js";
import logger from "../utils/logger.js";

export class BaseAgent {
  constructor(name, provider, apiKey, options = {}) {
    this.name = name;
    this.provider = provider;
    this.apiKey = apiKey;
    
    if (!apiKey) {
      throw new AppError(`${provider} API key is not configured`, 503);
    }

    this.breaker = new CircuitBreaker(this.chat.bind(this), {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 60000,
      name: `${name}-api`
    });
  }

  /**
   * Common error handler for API errors
   * Subclasses can override to add provider-specific handling
   */
  handleApiError(error) {
    // Check for authentication errors
    if (error.status === 401 || error.message.includes("API key")) {
      throw new AppError(`${this.provider} API key is invalid`, 401);
    }
    
    // Check for rate limit errors
    if (error.status === 429 || error.message.includes("quota") || error.message.includes("rate limit")) {
      throw new AppError(`${this.provider} rate limit exceeded`, 429);
    }
    
    // Check for server errors
    if (error.status >= 500 || error.message.includes("overloaded")) {
      throw new AppError(`${this.provider} servers are currently unavailable`, 503);
    }
    
    // Unknown error
    throw error;
  }

  async process(input, context = {}) {
    const MAX_INPUT_LENGTH = 10000;
    
    if (!input || typeof input !== 'string') {
      throw new AppError("Invalid input", 400, "INVALID_INPUT");
    }
    
    if (input.length > MAX_INPUT_LENGTH) {
      throw new AppError(`Input exceeds maximum length`, 400, "INPUT_TOO_LONG");
    }

    try {
      logger.info(`[${this.name}] Processing request`, { 
        inputLength: input.length 
      });
      
      const result = await this.breaker.execute(input, context);
      
      return {
        success: true,
        response: result,
        provider: this.provider,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`[${this.name}] Processing failed`, { 
        error: error.message 
      });
      
      if (error instanceof AppError) throw error;
      throw this.handleApiError(error);
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

  // Abstract method - must be implemented by subclasses
  async chat(message, context) {
    throw new Error("chat() method must be implemented by subclass");
  }
}
```

**Update agents to extend BaseAgent:**

```javascript
// src/agents/gemini-agent.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BaseAgent } from "./base-agent.js";
import { AppError } from "../utils/errors.js";

export class GeminiAgent extends BaseAgent {
  constructor(apiKey) {
    super("gemini-agent", "Gemini", apiKey);
    
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

    this.systemPrompt = `أنت مساعد ذكي متخصص في البنك والتقنية المالية...`;
  }

  async chat(message, context) {
    try {
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
      return result.response.text();
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  getStatus() {
    return {
      ...super.getStatus(),
      model: "gemini-2.0-flash-exp"
    };
  }
}
```

---

### 5. Add Performance Metrics Logging
**Effort:** ~2 hours  
**Impact:** Low (observability enhancement)  
**Assignee:** TBD

**Implementation:**

```javascript
// In each agent's process() method
async process(input, context = {}) {
  const startTime = Date.now();
  
  try {
    // ... existing validation ...
    
    const result = await this.breaker.execute(input, context);
    
    const duration = Date.now() - startTime;
    
    logger.info(`[${this.name}] Request completed`, {
      duration,
      inputLength: input.length,
      outputLength: result?.length || 0,
      hasHistory: !!(context.history && context.history.length),
      historyLength: context.history?.length || 0,
      model: this.model
    });
    
    return {
      success: true,
      response: result,
      provider: this.provider,
      model: this.model,
      timestamp: new Date().toISOString(),
      metrics: {
        duration,
        inputLength: input.length,
        outputLength: result?.length || 0
      }
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(`[${this.name}] Processing failed`, { 
      error: error.message,
      duration,
      inputLength: input.length
    });
    
    throw new AppError(`${this.provider} processing failed: ${error.message}`, 503);
  }
}
```

---

### 6. Move Magic Numbers to Configuration
**Effort:** ~1 hour  
**Impact:** Low (maintainability)  
**Assignee:** TBD

**Create configuration file:**

```javascript
// src/config/agents.js
export const AGENT_CONFIG = {
  // Input validation
  maxInputLength: 10000,
  maxHistoryMessages: 20,
  
  // Circuit breaker settings per agent
  gemini: {
    failureThreshold: 5,
    resetTimeout: 60000,
    timeout: 30000,
    model: "gemini-2.0-flash-exp",
    maxOutputTokens: 8192
  },
  
  perplexity: {
    failureThreshold: 3,
    resetTimeout: 30000,
    timeout: 30000,
    models: {
      fast: "llama-3.1-sonar-small-128k-online",
      balanced: "llama-3.1-sonar-large-128k-online",
      pro: "sonar-pro"
    }
  },
  
  claude: {
    failureThreshold: 5,
    resetTimeout: 60000,
    timeout: 45000,
    model: "claude-3-5-sonnet-20241022",
    maxTokens: 4096
  }
};
```

---

### 7. Add Complete JSDoc Documentation
**Effort:** ~1 hour  
**Impact:** Low (documentation completeness)  
**Assignee:** TBD

**Add to all agent methods:**

```javascript
/**
 * Gemini AI agent for financial and technical assistance
 * Uses Google's Generative AI API with circuit breaker protection
 */
export class GeminiAgent {
  /**
   * Create a new Gemini agent
   * @param {string} apiKey - Google API key for Gemini
   * @throws {AppError} When API key is not provided
   */
  constructor(apiKey) { ... }

  /**
   * Process a chat message using Gemini AI
   * @param {string} input - User's message (max 10,000 characters)
   * @param {Object} context - Conversation context
   * @param {Array<{role: string, content: string}>} [context.history=[]] - Previous messages
   * @param {number} [context.temperature=0.7] - Model creativity (0-1)
   * @returns {Promise<Object>} Response object with success, response, provider, model, timestamp
   * @throws {AppError} When API key invalid (401), rate limit exceeded (429), or processing fails (503)
   * @example
   * const result = await agent.process("Hello", { 
   *   history: [{ role: "user", content: "Hi" }],
   *   temperature: 0.8 
   * });
   */
  async process(input, context = {}) { ... }

  /**
   * Internal chat method called by circuit breaker
   * @private
   * @param {string} message - User message
   * @param {Object} context - Chat context with history and temperature
   * @returns {Promise<string>} AI response text
   * @throws {AppError} On API errors
   */
  async chat(message, context) { ... }

  /**
   * Get current agent health status
   * @returns {Object} Status object with name, provider, status, circuitBreaker state
   * @example
   * const status = agent.getStatus();
   * // { name: "gemini-agent", provider: "Gemini", status: "healthy", circuitBreaker: {...} }
   */
  getStatus() { ... }
}
```

---

## Implementation Timeline

### Week 1
- [ ] Priority 2.1: Add unit tests (4 hours)
- [ ] Priority 2.2: Add request timeouts (2 hours)

### Week 2
- [ ] Priority 2.3: Add input validation (1 hour)
- [ ] Priority 3.5: Add performance metrics (2 hours)

### Week 3 (Optional)
- [ ] Priority 3.4: Extract base agent class (3 hours)
- [ ] Priority 3.6: Move to configuration (1 hour)
- [ ] Priority 3.7: Complete JSDoc (1 hour)

---

## Testing Checklist

After implementing improvements, verify:

- [ ] All unit tests pass: `npm test`
- [ ] Zero security vulnerabilities: `npm audit`
- [ ] PR governance checks pass: `npm run pr-check`
- [ ] Server starts without errors: `npm start`
- [ ] Timeout works: Test with slow/unresponsive API
- [ ] Input validation rejects oversized inputs
- [ ] Circuit breaker opens after failures
- [ ] Health endpoint shows agent status
- [ ] Performance metrics logged correctly

---

## Success Criteria

**Priority 2 (Required for production confidence):**
- ✅ 80%+ test coverage on new agent code
- ✅ No requests hang longer than configured timeout
- ✅ Input validation prevents abuse

**Priority 3 (Nice to have):**
- ✅ Code duplication reduced by 50%
- ✅ All public methods documented with JSDoc
- ✅ Configuration externalized from code

---

## Notes

- All improvements are backward compatible
- No breaking changes required
- Can be implemented incrementally
- Each task is independently deployable

---

**Created:** 2026-02-19  
**Based on:** CODE-REVIEW-PR17.md  
**Version:** 1.0
