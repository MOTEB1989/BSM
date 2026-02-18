import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BSM Unified AI Gateway API',
      version: '1.0.0',
      description: `
# BSM Unified AI Gateway

A unified API gateway that routes requests to multiple AI providers (OpenAI, Claude, Gemini, Kimi) with automatic fallback, caching, rate limiting, and cost optimization.

## Features

- **Multi-Provider Support**: OpenAI, Anthropic Claude, Google Gemini, Moonshot Kimi, Perplexity
- **Automatic Fallback**: If one provider fails, automatically retry with the next available provider
- **Intelligent Caching**: Redis-based response caching to reduce costs and latency
- **Rate Limiting**: Per-API-key quota management
- **Cost Optimization**: Automatically select the cheapest model for your task
- **Request Logging**: Comprehensive logging of all requests for analytics
- **Transform Requests**: Automatically convert between different provider API formats

## Authentication

Most endpoints require an API key. Include your API key in the \`x-api-key\` header:

\`\`\`
x-api-key: gw_your_api_key_here
\`\`\`

Admin endpoints require an admin token in the \`x-admin-token\` header.

## Rate Limits

Rate limits are enforced per API key. Default limits:
- 1000 requests per hour
- Custom limits can be configured per key

Rate limit information is returned in response headers:
- \`X-RateLimit-Remaining\`: Number of requests remaining
- \`X-RateLimit-Reset\`: Unix timestamp when the limit resets
      `,
      contact: {
        name: 'BSM Support',
        url: 'https://lexdo.uk'
      },
      license: {
        name: 'Proprietary'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://your-production-url.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for gateway access'
        },
        AdminAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-admin-token',
          description: 'Admin token for administrative operations'
        }
      },
      schemas: {
        ChatMessage: {
          type: 'object',
          required: ['role', 'content'],
          properties: {
            role: {
              type: 'string',
              enum: ['system', 'user', 'assistant'],
              description: 'The role of the message sender'
            },
            content: {
              type: 'string',
              description: 'The content of the message'
            }
          }
        },
        ChatRequest: {
          type: 'object',
          required: ['messages'],
          properties: {
            messages: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ChatMessage'
              },
              description: 'Array of conversation messages'
            },
            model: {
              type: 'string',
              default: 'gpt-4o-mini',
              description: 'Model to use for completion'
            },
            temperature: {
              type: 'number',
              minimum: 0,
              maximum: 2,
              default: 0.7,
              description: 'Sampling temperature'
            },
            max_tokens: {
              type: 'integer',
              default: 1024,
              description: 'Maximum number of tokens to generate'
            },
            stream: {
              type: 'boolean',
              default: false,
              description: 'Whether to stream the response'
            },
            task_type: {
              type: 'string',
              enum: ['chat', 'code', 'analysis', 'search'],
              default: 'chat',
              description: 'Type of task for model selection optimization'
            },
            cost_optimize: {
              type: 'boolean',
              default: false,
              description: 'Use the cheapest available model for the task'
            },
            use_cache: {
              type: 'boolean',
              default: true,
              description: 'Enable response caching'
            },
            preferred_provider: {
              type: 'integer',
              nullable: true,
              description: 'Preferred provider ID to try first'
            }
          }
        },
        ChatResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            data: {
              type: 'object',
              properties: {
                requestId: {
                  type: 'string',
                  format: 'uuid'
                },
                response: {
                  type: 'string',
                  description: 'The generated response'
                },
                usage: {
                  type: 'object',
                  properties: {
                    prompt_tokens: { type: 'integer' },
                    completion_tokens: { type: 'integer' },
                    total_tokens: { type: 'integer' }
                  }
                },
                cost: {
                  type: 'number',
                  description: 'Cost in USD'
                },
                provider: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    type: { type: 'string' }
                  }
                },
                cached: {
                  type: 'boolean'
                },
                fallbackChain: {
                  type: 'array',
                  items: { type: 'string' }
                },
                attemptCount: {
                  type: 'integer'
                },
                duration: {
                  type: 'integer',
                  description: 'Duration in milliseconds'
                }
              }
            },
            rateLimit: {
              type: 'object',
              properties: {
                remaining: { type: 'integer' },
                reset: { type: 'integer' }
              }
            }
          }
        },
        Provider: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            type: {
              type: 'string',
              enum: ['openai', 'anthropic', 'google', 'kimi', 'perplexity']
            },
            priority: { type: 'integer' },
            available: { type: 'boolean' }
          }
        },
        Model: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            provider: { type: 'string' },
            providerType: { type: 'string' },
            available: { type: 'boolean' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Gateway',
        description: 'Main gateway endpoints for AI completions'
      },
      {
        name: 'Providers',
        description: 'Provider management and information'
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints (requires admin token)'
      }
    ]
  },
  apis: ['./src/routes/gateway.js']
};

export const swaggerSpec = swaggerJsdoc(options);
