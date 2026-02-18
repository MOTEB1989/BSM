# Unified AI Gateway API Documentation

## Overview

The BSM Unified AI Gateway is a powerful API gateway that provides a single endpoint to access multiple AI providers (OpenAI, Anthropic Claude, Google Gemini, Moonshot Kimi, Perplexity) with automatic fallback, intelligent caching, rate limiting, and cost optimization.

## Features

### 🚀 Multi-Provider Support
- **OpenAI**: GPT-4, GPT-4o, GPT-4o-mini, GPT-3.5-turbo
- **Anthropic**: Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **Google**: Gemini Pro, Gemini Pro Vision
- **Moonshot**: Kimi (moonshot-v1-8k, 32k, 128k)
- **Perplexity**: Sonar models with web search

### 🔄 Automatic Fallback
If one provider fails, the gateway automatically retries with the next available provider based on priority:
```
GPT-4o (priority 90) → Claude 3 Sonnet (85) → GPT-4o-mini (80) → Gemini Pro (75) → ...
```

### 💾 Intelligent Caching
- Redis-based response caching
- Automatic cache key generation from request parameters
- Configurable TTL (default: 1 hour)
- Reduces costs by avoiding duplicate requests
- Cache hit/miss tracking for analytics

### ⚡ Rate Limiting
- Per-API-key quota management
- Configurable rate limits (requests per time window)
- Redis-backed for distributed rate limiting
- Database fallback for reliability
- Rate limit information in response headers

### 💰 Cost Optimization
- Automatic selection of cheapest model for task type
- Real-time cost calculation and tracking
- Usage analytics and reporting
- Task-specific model recommendations:
  - **Chat**: gpt-4o-mini, claude-3-haiku, gemini-pro
  - **Code**: claude-3-sonnet, gpt-4o, claude-3-opus
  - **Analysis**: claude-3-opus, gpt-4o, claude-3-sonnet
  - **Search**: perplexity sonar, gemini-pro

### 📊 Request Logging
- Comprehensive logging of all requests
- Tracks tokens, cost, duration, status
- Analytics by provider, model, API key
- Error rate monitoring
- Recent requests history

### 🔀 Request Transformation
Automatically converts between different provider API formats:
- OpenAI Chat Completions format ↔ Anthropic Messages format
- OpenAI format ↔ Google Gemini format
- Unified response format for all providers

## Quick Start

### 1. Prerequisites

```bash
# Install dependencies
npm install

# Set up PostgreSQL database
docker-compose up -d postgres

# Set up Redis cache
docker-compose up -d redis

# Initialize database schema
psql -U bsm_user -d bsm -f src/database/schema.sql
```

### 2. Configuration

Create a `.env` file:

```bash
# API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
KIMI_API_KEY=...
PERPLEXITY_KEY=pplx-...

# Admin Token (for management endpoints)
ADMIN_TOKEN=your_secure_admin_token

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=bsm
POSTGRES_USER=bsm_user
POSTGRES_PASSWORD=your_secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Start the Server

```bash
npm start
```

The API will be available at `http://localhost:3000/api/gateway`

### 4. Generate an API Key

```bash
curl -X POST http://localhost:3000/api/gateway/admin/keys \
  -H "x-admin-token: your_secure_admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "name": "My App",
    "rateLimit": 1000,
    "rateLimitWindow": 3600
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "apiKey": "gw_abc123...",
    "keyPrefix": "gw_abc123",
    "rateLimit": 1000,
    "rateLimitWindow": 3600
  },
  "warning": "Store this API key securely. It will not be shown again."
}
```

## API Endpoints

### 🌐 Public Endpoints

#### POST /api/gateway/chat
Main unified gateway endpoint for chat completions.

**Request:**
```bash
curl -X POST http://localhost:3000/api/gateway/chat \
  -H "x-api-key: gw_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ],
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "max_tokens": 1024,
    "cost_optimize": false,
    "use_cache": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "response": "Hello! How can I help you today?",
    "usage": {
      "prompt_tokens": 15,
      "completion_tokens": 8,
      "total_tokens": 23
    },
    "cost": 0.000014,
    "provider": {
      "id": 3,
      "name": "OpenAI GPT-4o-mini",
      "type": "openai"
    },
    "cached": false,
    "fallbackChain": ["OpenAI GPT-4o-mini"],
    "attemptCount": 1,
    "duration": 523
  },
  "rateLimit": {
    "remaining": 999,
    "reset": 1708291200000
  }
}
```

**Parameters:**
- `messages` (required): Array of message objects with `role` and `content`
- `model` (optional): Model to use (default: "gpt-4o-mini")
- `temperature` (optional): 0-2 (default: 0.7)
- `max_tokens` (optional): Maximum tokens to generate (default: 1024)
- `task_type` (optional): "chat", "code", "analysis", "search" (default: "chat")
- `cost_optimize` (optional): Use cheapest model for task (default: false)
- `use_cache` (optional): Enable caching (default: true)
- `preferred_provider` (optional): Provider ID to try first

#### GET /api/gateway/providers
List available AI providers.

**Request:**
```bash
curl http://localhost:3000/api/gateway/providers
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "OpenAI GPT-4",
      "type": "openai",
      "priority": 100,
      "available": true
    },
    {
      "id": 2,
      "name": "Claude 3 Opus",
      "type": "anthropic",
      "priority": 95,
      "available": true
    }
  ]
}
```

#### GET /api/gateway/models
List available models across all providers.

**Request:**
```bash
curl http://localhost:3000/api/gateway/models
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "model": "gpt-4o-mini",
      "provider": "OpenAI GPT-4o-mini",
      "providerType": "openai",
      "available": true
    },
    {
      "model": "claude-3-sonnet",
      "provider": "Claude 3 Sonnet",
      "providerType": "anthropic",
      "available": true
    }
  ]
}
```

#### GET /api/gateway/usage
Get usage statistics for your API key.

**Request:**
```bash
curl http://localhost:3000/api/gateway/usage?days=7 \
  -H "x-api-key: gw_your_api_key"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_requests": 1523,
    "total_tokens": 245680,
    "total_cost": 12.34,
    "avg_duration": 543,
    "success_count": 1498,
    "error_count": 15,
    "cached_count": 234
  },
  "period": "7 days"
}
```

#### GET /api/gateway/test
Test connectivity to all providers.

**Request:**
```bash
curl http://localhost:3000/api/gateway/test
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "provider": "OpenAI GPT-4o-mini",
      "status": "success",
      "available": true,
      "responseTime": 523
    },
    {
      "provider": "Claude 3 Sonnet",
      "status": "no_api_key",
      "available": false
    }
  ]
}
```

#### GET /api/gateway/stats
Get public gateway statistics.

**Request:**
```bash
curl http://localhost:3000/api/gateway/stats?hours=24
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": {
      "total_requests": 5423,
      "total_tokens": 1234567,
      "total_cost": 234.56,
      "success_count": 5234,
      "error_count": 123,
      "cached_count": 987
    },
    "cache": {
      "total_entries": 456,
      "total_hits": 1234,
      "total_tokens_saved": 345678,
      "total_cost_saved": 45.67
    },
    "period": "24 hours"
  }
}
```

### 🔐 Admin Endpoints

All admin endpoints require the `x-admin-token` header.

#### POST /api/gateway/admin/keys
Generate a new API key.

**Request:**
```bash
curl -X POST http://localhost:3000/api/gateway/admin/keys \
  -H "x-admin-token: your_admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "name": "Production App",
    "rateLimit": 10000,
    "rateLimitWindow": 3600,
    "expiresInDays": 365
  }'
```

#### GET /api/gateway/admin/providers
List all providers with details.

**Request:**
```bash
curl http://localhost:3000/api/gateway/admin/providers \
  -H "x-admin-token: your_admin_token"
```

#### POST /api/gateway/admin/providers
Add a new provider.

**Request:**
```bash
curl -X POST http://localhost:3000/api/gateway/admin/providers \
  -H "x-admin-token: your_admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom GPT-4",
    "type": "openai",
    "apiUrl": "https://api.openai.com/v1/chat/completions",
    "priority": 85,
    "enabled": true
  }'
```

#### PUT /api/gateway/admin/providers/:id
Update provider configuration.

**Request:**
```bash
curl -X PUT http://localhost:3000/api/gateway/admin/providers/1 \
  -H "x-admin-token: your_admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "priority": 95,
    "enabled": true
  }'
```

## OpenAPI/Swagger Documentation

Interactive API documentation is available at:
```
http://localhost:3000/api/gateway/docs
```

OpenAPI JSON specification:
```
http://localhost:3000/api/gateway/docs.json
```

## Docker Compose Setup

```yaml
version: '3.8'

services:
  bsm-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - POSTGRES_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=bsm
      - POSTGRES_USER=bsm_user
      - POSTGRES_PASSWORD=bsm_password
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./src/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
```

Start with:
```bash
docker-compose up -d
```

## Cost Optimization Tips

1. **Enable Caching**: Set `use_cache: true` to avoid duplicate requests
2. **Use Cost Optimization**: Set `cost_optimize: true` for non-critical tasks
3. **Select Appropriate Models**: 
   - Use gpt-4o-mini for simple tasks ($0.15/$0.60 per 1M tokens)
   - Use gpt-4o for complex tasks ($5/$15 per 1M tokens)
   - Use claude-3-haiku for fastest responses ($0.25/$1.25 per 1M tokens)
4. **Set Reasonable Max Tokens**: Don't request more tokens than needed
5. **Monitor Usage**: Use `/api/gateway/usage` endpoint regularly

## Rate Limiting

Rate limits are enforced per API key:
- Default: 1000 requests per hour
- Customizable per key
- Returns 429 status when exceeded
- Rate limit info in response headers

## Error Handling

The gateway returns standardized error responses:

```json
{
  "error": "All providers failed. Attempted: GPT-4o → Claude 3 → Gemini",
  "code": "ALL_PROVIDERS_FAILED",
  "statusCode": 503,
  "metadata": {
    "fallbackChain": ["OpenAI GPT-4o", "Claude 3 Sonnet", "Gemini Pro"],
    "errors": [
      {"provider": "OpenAI GPT-4o", "error": "Rate limit exceeded"},
      {"provider": "Claude 3 Sonnet", "error": "API key invalid"},
      {"provider": "Gemini Pro", "error": "Timeout"}
    ]
  }
}
```

Common error codes:
- `MISSING_API_KEY`: No API key provided
- `INVALID_API_KEY`: API key not found or invalid
- `API_KEY_DISABLED`: API key has been disabled
- `API_KEY_EXPIRED`: API key has expired
- `RATE_LIMIT_EXCEEDED`: Request limit exceeded
- `ALL_PROVIDERS_FAILED`: All providers failed
- `INVALID_REQUEST`: Invalid request format
- `PROVIDER_ERROR`: Provider-specific error

## Monitoring & Analytics

### Database Views

The gateway provides several database views for analytics:

```sql
-- Usage statistics by hour
SELECT * FROM gateway_usage_stats;

-- Cache performance
SELECT * FROM gateway_cache_stats;

-- Recent requests
SELECT * FROM gateway_requests ORDER BY created_at DESC LIMIT 100;
```

### Metrics

Track these key metrics:
- **Request Rate**: Total requests per hour
- **Error Rate**: Failed requests / total requests
- **Cache Hit Rate**: Cached responses / total responses
- **Average Latency**: Average duration_ms
- **Cost per Request**: Average cost_usd
- **Token Usage**: Total tokens consumed

## Best Practices

1. **Always provide an API key** for tracking and rate limiting
2. **Enable caching** for repeated queries
3. **Set appropriate timeouts** in your client
4. **Handle errors gracefully** with fallback logic
5. **Monitor your usage** to avoid unexpected costs
6. **Use task_type parameter** for optimal model selection
7. **Keep messages concise** to reduce token usage
8. **Rotate API keys regularly** for security

## Support

For issues or questions:
- GitHub: https://github.com/MOTEB1989/BSM
- Documentation: https://lexdo.uk
- Email: support@lexdo.uk

## License

Proprietary - © 2024 BSM Platform
