# Unified AI Gateway Examples

This directory contains example scripts demonstrating how to use the BSM Unified AI Gateway API.

## Prerequisites

1. Start the BSM server:
   ```bash
   npm start
   ```

2. Or use Docker Compose:
   ```bash
   docker-compose -f docker-compose.gateway.yml up -d
   ```

3. (Optional) Configure API keys in `.env`:
   ```bash
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   GOOGLE_API_KEY=AIza...
   KIMI_API_KEY=...
   PERPLEXITY_KEY=pplx-...
   ```

## Running Examples

### Gateway Usage Examples
Comprehensive examples of all gateway features:

```bash
node examples/gateway-usage.js
```

This will demonstrate:
1. Basic chat completion
2. Cost-optimized requests
3. Listing available providers
4. Listing available models
5. Testing provider connectivity
6. Automatic fallback handling
7. Gateway statistics
8. Conversation with history

## Manual Testing with cURL

### 1. List Providers
```bash
curl http://localhost:3000/api/gateway/providers
```

### 2. List Models
```bash
curl http://localhost:3000/api/gateway/models
```

### 3. Test Providers
```bash
curl http://localhost:3000/api/gateway/test
```

### 4. Basic Chat (requires API key)
```bash
curl -X POST http://localhost:3000/api/gateway/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "model": "gpt-4o-mini"
  }'
```

### 5. Cost-Optimized Request
```bash
curl -X POST http://localhost:3000/api/gateway/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key" \
  -d '{
    "messages": [
      {"role": "user", "content": "Write a haiku"}
    ],
    "cost_optimize": true,
    "task_type": "chat"
  }'
```

### 6. Get Statistics
```bash
curl http://localhost:3000/api/gateway/stats?hours=24
```

### 7. Get Usage (requires API key)
```bash
curl http://localhost:3000/api/gateway/usage?days=7 \
  -H "x-api-key: your_api_key"
```

## Admin Operations

### Generate API Key
```bash
curl -X POST http://localhost:3000/api/gateway/admin/keys \
  -H "x-admin-token: your_admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "name": "My App",
    "rateLimit": 1000,
    "rateLimitWindow": 3600
  }'
```

### List All Providers (Admin)
```bash
curl http://localhost:3000/api/gateway/admin/providers \
  -H "x-admin-token: your_admin_token"
```

### Add New Provider
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

### Update Provider Priority
```bash
curl -X PUT http://localhost:3000/api/gateway/admin/providers/1 \
  -H "x-admin-token: your_admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "priority": 95
  }'
```

## Interactive API Documentation

Open your browser and navigate to:
```
http://localhost:3000/api/gateway/docs
```

This provides an interactive Swagger UI where you can:
- Browse all available endpoints
- Test endpoints directly in the browser
- View request/response schemas
- Generate code examples

## Testing with Postman

1. Import the OpenAPI specification:
   ```
   http://localhost:3000/api/gateway/docs.json
   ```

2. Set up environment variables:
   - `baseUrl`: `http://localhost:3000/api/gateway`
   - `apiKey`: Your gateway API key
   - `adminToken`: Your admin token

3. Use the imported collection to test all endpoints

## JavaScript/Node.js Client Example

```javascript
import fetch from 'node-fetch';

async function chatWithGateway(messages, options = {}) {
  const response = await fetch('http://localhost:3000/api/gateway/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.GATEWAY_API_KEY
    },
    body: JSON.stringify({
      messages,
      model: options.model || 'gpt-4o-mini',
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1024,
      cost_optimize: options.costOptimize || false,
      use_cache: options.useCache !== false
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return await response.json();
}

// Usage
const result = await chatWithGateway([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'What is the capital of France?' }
]);

console.log(result.data.response);
```

## Python Client Example

```python
import requests
import os

def chat_with_gateway(messages, **options):
    response = requests.post(
        'http://localhost:3000/api/gateway/chat',
        headers={
            'Content-Type': 'application/json',
            'x-api-key': os.environ.get('GATEWAY_API_KEY')
        },
        json={
            'messages': messages,
            'model': options.get('model', 'gpt-4o-mini'),
            'temperature': options.get('temperature', 0.7),
            'max_tokens': options.get('max_tokens', 1024),
            'cost_optimize': options.get('cost_optimize', False),
            'use_cache': options.get('use_cache', True)
        }
    )
    
    response.raise_for_status()
    return response.json()

# Usage
result = chat_with_gateway([
    {'role': 'system', 'content': 'You are a helpful assistant.'},
    {'role': 'user', 'content': 'What is the capital of France?'}
])

print(result['data']['response'])
```

## Troubleshooting

### Server not responding
```bash
# Check if server is running
curl http://localhost:3000/api/health

# Check logs
docker-compose -f docker-compose.gateway.yml logs gateway-api
```

### Database connection errors
```bash
# Check PostgreSQL status
docker-compose -f docker-compose.gateway.yml ps postgres

# Connect to database
docker-compose -f docker-compose.gateway.yml exec postgres \
  psql -U bsm_user -d bsm
```

### Redis connection errors
```bash
# Check Redis status
docker-compose -f docker-compose.gateway.yml ps redis

# Test Redis connection
docker-compose -f docker-compose.gateway.yml exec redis redis-cli ping
```

### No providers available
Make sure you have configured at least one AI provider API key in your `.env` file:
```bash
# Check which providers are configured
curl http://localhost:3000/api/gateway/test
```

## More Information

- [Gateway API Documentation](../docs/GATEWAY-API.md)
- [Main README](../README.md)
- [OpenAPI Specification](http://localhost:3000/api/gateway/docs.json)
