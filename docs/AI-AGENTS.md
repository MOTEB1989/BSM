# AI Agents Integration - Gemini, Perplexity, Claude

## Overview

BSU/LexBANK now supports three additional AI providers:
- **Google Gemini** (gemini-2.0-flash-exp) - Specialized in financial and technical assistance
- **Perplexity AI** (Sonar models) - Real-time search and research with citations
- **Anthropic Claude** (claude-3-5-sonnet) - Deep legal and financial analysis

## Architecture

### Components

1. **Agent Classes** (`src/agents/`)
   - `gemini-agent.js` - Google Gemini integration
   - `perplexity-agent.js` - Perplexity AI search integration
   - `claude-agent.js` - Anthropic Claude integration
   - `index.js` - Agent registry and initialization

2. **Utilities**
   - `circuitBreaker.js` - Circuit breaker pattern for API resilience
   - Prevents cascading failures with configurable thresholds

3. **Routes** (`src/routes/chat.js`)
   - `POST /api/chat/gemini` - Chat with Gemini
   - `POST /api/chat/perplexity` - Search with Perplexity
   - `POST /api/chat/claude` - Chat with Claude
   - `GET /api/chat/agents-status` - Get all AI agents status
   - `GET /api/chat/key-status` - Get API key availability

## Configuration

### Environment Variables

Add these to your `.env` file or environment:

```bash
# Google Gemini
GEMINI_API_KEY=AIzaSyC...

# Perplexity AI
PERPLEXITY_API_KEY=pplx-...

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Fallback Keys

The system also accepts these alternative variable names:
- `GOOGLE_API_KEY` (for Gemini)
- `PERPLEXITY_KEY` (for Perplexity)

## API Endpoints

### 1. Chat with Gemini

```bash
POST /api/chat/gemini
Content-Type: application/json

{
  "message": "ما هي أنواع الشركات في السعودية؟",
  "history": [
    {"role": "user", "content": "مرحباً"},
    {"role": "assistant", "content": "أهلاً بك"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "response": "هناك عدة أنواع من الشركات...",
  "provider": "Gemini",
  "model": "gemini-2.0-flash-exp",
  "timestamp": "2026-02-18T21:00:00.000Z"
}
```

### 2. Search with Perplexity

```bash
POST /api/chat/perplexity
Content-Type: application/json

{
  "message": "سعر صرف الدولار اليوم",
  "model": "balanced"  // or "fast" or "pro"
}
```

**Response:**
```json
{
  "success": true,
  "response": "حسب آخر التحديثات...",
  "citations": ["source1.com", "source2.com"],
  "provider": "Perplexity",
  "model": "llama-3.1-sonar-large-128k-online",
  "timestamp": "2026-02-18T21:00:00.000Z"
}
```

**Available Models:**
- `fast` - llama-3.1-sonar-small-128k-online (fastest)
- `balanced` - llama-3.1-sonar-large-128k-online (default)
- `pro` - sonar-pro (most accurate)

### 3. Chat with Claude

```bash
POST /api/chat/claude
Content-Type: application/json

{
  "message": "حلل هذا العقد القانوني",
  "history": [],
  "temperature": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "response": "بناءً على تحليل العقد...",
  "provider": "Claude",
  "model": "claude-3-5-sonnet-20241022",
  "timestamp": "2026-02-18T21:00:00.000Z"
}
```

### 4. Check Agents Status

```bash
GET /api/chat/agents-status
```

**Response:**
```json
{
  "available": true,
  "agents": {
    "gemini-agent": {
      "name": "gemini-agent",
      "provider": "Gemini",
      "status": "healthy",
      "circuitBreaker": {
        "state": "CLOSED",
        "failureCount": 0,
        "nextAttempt": null
      }
    }
  },
  "list": ["gemini-agent", "perplexity-agent", "claude-agent"],
  "timestamp": "2026-02-18T21:00:00.000Z"
}
```

### 5. Check API Keys Status

```bash
GET /api/chat/key-status
```

**Response:**
```json
{
  "timestamp": "2026-02-18T21:00:00.000Z",
  "status": {
    "openai": true,
    "anthropic": true,
    "perplexity": true,
    "google": true
  },
  "ui": {
    "openai": "✅ GPT-4 Ready",
    "anthropic": "✅ Claude Ready",
    "perplexity": "✅ Perplexity Ready",
    "google": "✅ Gemini Ready"
  }
}
```

## Circuit Breaker Pattern

Each agent uses a circuit breaker to prevent cascading failures:

### States
- **CLOSED** - Normal operation
- **OPEN** - Too many failures, rejecting requests
- **HALF_OPEN** - Testing recovery

### Configuration
- **Gemini**: 5 failures threshold, 60s reset
- **Perplexity**: 3 failures threshold, 30s reset
- **Claude**: 5 failures threshold, 60s reset

## Error Handling

### Agent Not Available
```json
{
  "error": "Gemini agent is not available. GEMINI_API_KEY is not configured.",
  "code": "AGENT_NOT_AVAILABLE",
  "correlationId": "..."
}
```

### Rate Limit Exceeded
```json
{
  "error": "Gemini rate limit exceeded",
  "code": "APP_ERROR",
  "correlationId": "..."
}
```

### Circuit Breaker Open
```json
{
  "error": "Gemini processing failed: Circuit breaker gemini-api is OPEN",
  "code": "APP_ERROR",
  "correlationId": "..."
}
```

## Deployment

### Render.com

Add environment variables in the Render Dashboard:

1. Go to your service → Environment
2. Add:
   - `GEMINI_API_KEY`
   - `PERPLEXITY_API_KEY`
   - `ANTHROPIC_API_KEY`
3. Deploy

### Docker

```dockerfile
ENV GEMINI_API_KEY=your-key
ENV PERPLEXITY_API_KEY=your-key
ENV ANTHROPIC_API_KEY=your-key
```

### Local Development

```bash
cp .env.example .env
# Edit .env and add your API keys
npm install
npm start
```

## Security Considerations

1. **API Keys**: Never commit API keys to the repository
2. **Rate Limiting**: All `/api/chat/*` endpoints are rate-limited
3. **Circuit Breaker**: Prevents API abuse and cascading failures
4. **Input Validation**: All messages are validated and sanitized
5. **CORS**: Only allowed origins can access the API

## Testing

### Without API Keys (Safe Mode)

The system gracefully handles missing API keys:

```bash
npm start
# Agents will show warnings but server will start successfully
```

### With API Keys

```bash
# Set environment variables
export GEMINI_API_KEY=your-key
export PERPLEXITY_API_KEY=your-key
export ANTHROPIC_API_KEY=your-key

# Start server
npm start

# Test endpoints
curl -X POST http://localhost:3000/api/chat/gemini \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

## Dependencies

New packages added:
- `@google/generative-ai@^0.21.0` - Google Gemini SDK
- `node-fetch@^3.3.2` - HTTP client for Perplexity API
- `@anthropic-ai/sdk@^0.32.1` - Anthropic Claude SDK (already installed)

## Monitoring

Check agent health:
```bash
curl http://localhost:3000/api/chat/agents-status
```

Check logs:
```bash
# Server logs show agent initialization
[INFO] ✅ Gemini agent registered
[INFO] ✅ Perplexity agent registered
[INFO] ✅ Claude agent registered
```

## Future Enhancements

- [ ] Streaming responses support
- [ ] Agent conversation history persistence
- [ ] Multi-agent orchestration
- [ ] Advanced error recovery strategies
- [ ] Usage metrics and analytics
- [ ] Cost tracking per agent

## Support

For issues or questions:
- Check logs in `logs/` directory
- Review correlation IDs in error responses
- Verify API key configuration
- Check circuit breaker status in `/api/chat/agents-status`
