# AI Gateway Addition for README.md

Add this section after the "Project Structure" section:

---

## 🌐 Unified AI Gateway

The BSU platform includes a production-ready **Unified AI Gateway** that intelligently routes requests to multiple AI providers with automatic fallback, caching, and cost optimization.

### Key Features

- **Multi-Provider Support**: OpenAI, Claude, Gemini, Perplexity, Kimi
- **Automatic Fallback**: Seamless provider switching on failure
- **Smart Caching**: Redis-based response caching
- **Rate Limiting**: Per-API-key quotas and limits
- **Cost Optimization**: Intelligent model selection based on task type
- **Usage Analytics**: Real-time tracking and reporting
- **OpenAPI Documentation**: Interactive Swagger UI at `/api-docs`

### Quick Start

1. **Start Infrastructure**:
   ```bash
   docker-compose -f docker-compose.gateway.yml up -d
   ```

2. **Configure Environment**:
   ```bash
   # Add to .env
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   GOOGLE_API_KEY=...
   REDIS_URL=redis://localhost:6379
   DATABASE_URL=postgresql://bsu_user:password@localhost:5432/bsu_gateway
   ```

3. **Create API Key**:
   ```bash
   curl -X POST http://localhost:3000/api/gateway/admin/api-keys \
     -H "X-Admin-Token: your-admin-token" \
     -H "Content-Type: application/json" \
     -d '{"user_id": "user123", "description": "My API Key"}'
   ```

4. **Make Requests**:
   ```bash
   curl -X POST http://localhost:3000/api/gateway/completions \
     -H "X-API-Key: bsu_your_key..." \
     -H "Content-Type: application/json" \
     -d '{"messages": [{"role": "user", "content": "Hello!"}]}'
   ```

### Documentation

- **Full Documentation**: [docs/AI-GATEWAY.md](docs/AI-GATEWAY.md)
- **API Docs**: http://localhost:3000/api-docs
- **Admin UI**: http://localhost:3000/admin/gateway.html

### Testing

```bash
# Run integration tests
node scripts/test-gateway.js

# Run examples
export GATEWAY_API_KEY=bsu_your_key...
node scripts/gateway-examples.js
```

---
