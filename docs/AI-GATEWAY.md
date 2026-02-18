# BSU Unified AI Gateway

A production-ready unified API gateway that intelligently routes requests to multiple AI providers with automatic fallback, caching, rate limiting, and cost optimization.

## Features

### 🔄 Multi-Provider Support
- **OpenAI**: GPT-4, GPT-4o, GPT-4o-mini
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Sonnet
- **Google**: Gemini Pro, Gemini 1.5 Pro
- **Perplexity**: Sonar, Sonar Pro (with web search)
- **Kimi (Moonshot)**: Moonshot v1 models (8k, 32k, 128k context)

### 🛡️ Automatic Fallback
If a provider fails or is unavailable, the gateway automatically tries the next available provider based on priority configuration.

### 💾 Smart Caching
- Redis-based response caching
- Configurable TTL per request
- Reduces costs and improves response times
- Cache hit/miss tracking

### 🎯 Rate Limiting & Quotas
- Per-API-key rate limiting (100 req/min default)
- Daily and monthly usage quotas
- Real-time quota tracking
- PostgreSQL-backed persistence

### 💰 Cost Optimization
- Automatic model selection based on task type
- Budget-aware routing (low/medium/high)
- Real-time cost calculation and tracking
- Usage analytics and reporting

### 📊 Usage Analytics
- Request/response logging
- Token usage tracking
- Cost per request
- Provider performance metrics
- Top users and usage patterns

### 🔐 Security
- API key authentication
- Admin token for privileged operations
- Rate limiting to prevent abuse
- Request validation and sanitization

### 📚 OpenAPI Documentation
- Interactive Swagger UI at `/api-docs`
- Complete API reference
- Request/response examples
- Authentication guides

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Infrastructure

Start Redis and PostgreSQL using Docker Compose:

```bash
docker-compose -f docker-compose.gateway.yml up -d
```

This will start:
- Redis on `localhost:6379`
- PostgreSQL on `localhost:5432`

### 3. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

```env
# At least one AI provider API key
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
KIMI_API_KEY=...

# Database connections (optional - gateway works without them)
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://bsu_user:bsu_secure_password_change_me@localhost:5432/bsu_gateway

# Admin token for management endpoints
ADMIN_TOKEN=your-secure-admin-token-here
```

### 4. Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

### 5. Create an API Key

Create an API key for accessing the gateway:

```bash
curl -X POST http://localhost:3000/api/gateway/admin/api-keys \
  -H "X-Admin-Token: your-secure-admin-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "description": "My first API key",
    "daily_quota": 1000,
    "monthly_quota": 30000
  }'
```

Save the returned API key - it will only be shown once!

## API Usage

### Basic Chat Completion

```bash
curl -X POST http://localhost:3000/api/gateway/completions \
  -H "X-API-Key: bsu_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello, how are you?"}
    ],
    "temperature": 0.7,
    "max_tokens": 1200
  }'
```

### Cost-Optimized Request

Let the gateway select the optimal model based on task type and budget:

```bash
curl -X POST http://localhost:3000/api/gateway/completions \
  -H "X-API-Key: bsu_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Write a Python function to sort a list"}
    ],
    "task_type": "code_generation",
    "budget": "low"
  }'
```

### Provider-Specific Request

Prefer a specific provider (with automatic fallback):

```bash
curl -X POST http://localhost:3000/api/gateway/completions \
  -H "X-API-Key: bsu_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Analyze this code..."}
    ],
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022"
  }'
```

### Simple Chat Interface

```bash
curl -X POST http://localhost:3000/api/gateway/chat \
  -H "X-API-Key: bsu_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the capital of France?",
    "history": [
      {"role": "user", "content": "Hello"},
      {"role": "assistant", "content": "Hi! How can I help you?"}
    ]
  }'
```

## Admin Endpoints

All admin endpoints require the `X-Admin-Token` header.

### List API Keys

```bash
curl http://localhost:3000/api/gateway/admin/api-keys \
  -H "X-Admin-Token: your-admin-token"
```

### Get API Key Details

```bash
curl http://localhost:3000/api/gateway/admin/api-keys/1 \
  -H "X-Admin-Token: your-admin-token"
```

### Update API Key Quotas

```bash
curl -X PATCH http://localhost:3000/api/gateway/admin/api-keys/1 \
  -H "X-Admin-Token: your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "daily_quota": 2000,
    "monthly_quota": 50000
  }'
```

### Revoke API Key

```bash
curl -X DELETE http://localhost:3000/api/gateway/admin/api-keys/1 \
  -H "X-Admin-Token: your-admin-token"
```

### Usage Analytics

```bash
curl "http://localhost:3000/api/gateway/admin/analytics/usage?start_date=2024-01-01&end_date=2024-12-31" \
  -H "X-Admin-Token: your-admin-token"
```

### Top Users

```bash
curl "http://localhost:3000/api/gateway/admin/analytics/top-users?limit=10&metric=cost" \
  -H "X-Admin-Token: your-admin-token"
```

### Provider Management

List all providers:

```bash
curl http://localhost:3000/api/gateway/admin/providers \
  -H "X-Admin-Token: your-admin-token"
```

Update provider priority:

```bash
curl -X PATCH http://localhost:3000/api/gateway/admin/providers/1 \
  -H "X-Admin-Token: your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "priority": 1,
    "is_active": true
  }'
```

### Model Pricing

View current pricing:

```bash
curl http://localhost:3000/api/gateway/admin/pricing \
  -H "X-Admin-Token: your-admin-token"
```

Update pricing:

```bash
curl -X PUT http://localhost:3000/api/gateway/admin/pricing/openai/gpt-4o-mini \
  -H "X-Admin-Token: your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "input_cost_per_1m": 0.15,
    "output_cost_per_1m": 0.60
  }'
```

## Response Format

All completion requests return an OpenAI-compatible format:

```json
{
  "id": "req_abc123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4o-mini",
  "provider": "openai",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Response content here..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 50,
    "total_tokens": 70
  },
  "from_cache": false,
  "response_time_ms": 1234
}
```

## Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Remaining: 95
X-Quota-Daily-Used: 5
X-Quota-Daily-Limit: 1000
X-Quota-Monthly-Used: 150
X-Quota-Monthly-Limit: 30000
```

## Task Types & Model Selection

The gateway automatically selects optimal models based on task type:

### Task Types:
- `chat`: General conversation
- `code_generation`: Code writing and generation
- `analysis`: Data analysis, document review
- `search`: Web search-augmented responses

### Budget Levels:
- `low`: Most cost-effective models
- `medium`: Balanced quality and cost
- `high`: Best quality, higher cost

## Circuit Breaker

Each provider has a circuit breaker that:
- Opens after 3 consecutive failures
- Automatically retries after 60 seconds
- Prevents cascading failures

## API Documentation

Interactive API documentation is available at:

```
http://localhost:3000/api-docs
```

## Database Schema

The gateway uses PostgreSQL for:
- API key management
- Usage tracking
- Quota enforcement
- Cost calculation
- Analytics

See `scripts/init-gateway-db.sql` for the complete schema.

## Production Deployment

### Environment Variables

Required for production:
- At least one AI provider API key
- `ADMIN_TOKEN`: Strong, randomly generated token
- `REDIS_URL`: Redis connection string
- `DATABASE_URL`: PostgreSQL connection string

### Docker Deployment

1. Build the image:
```bash
docker build -t bsu-gateway .
```

2. Run with docker-compose:
```bash
docker-compose -f docker-compose.gateway.yml up -d
```

### Security Considerations

- Use HTTPS in production
- Store API keys securely (secrets manager)
- Rotate admin token regularly
- Monitor rate limits and quotas
- Review usage analytics for anomalies
- Keep provider API keys in secure vault

## Monitoring

### Health Check

```bash
curl http://localhost:3000/api/health
```

### Provider Status

```bash
curl http://localhost:3000/api/gateway/providers
```

### Admin Health

```bash
curl http://localhost:3000/api/gateway/admin/health \
  -H "X-Admin-Token: your-admin-token"
```

## Troubleshooting

### Gateway not connecting to Redis/PostgreSQL

The gateway will work without Redis and PostgreSQL, but with limited functionality:
- No caching
- No usage tracking
- No quota enforcement

Check logs for connection errors and ensure services are running.

### All providers failing

Check provider status:
```bash
curl http://localhost:3000/api/gateway/providers
```

Verify API keys are correct in environment variables.

### Rate limit exceeded

Wait for the rate limit window to reset (default: 60 seconds) or increase quotas via admin API.

## License

MIT

## Support

For issues and support, please visit:
https://github.com/MOTEB1989/BSM/issues
