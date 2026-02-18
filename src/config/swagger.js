import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BSU Unified AI Gateway API",
      version: "1.0.0",
      description: `
# BSU Unified AI Gateway

A unified API gateway that routes requests to multiple AI providers with automatic fallback, 
rate limiting, caching, and cost optimization.

## Features

- **Multi-Provider Support**: OpenAI, Claude, Gemini, Perplexity, Kimi
- **Automatic Fallback**: If one provider fails, automatically try the next
- **Smart Caching**: Redis-based response caching to reduce costs
- **Rate Limiting**: Per-API-key request rate limits
- **Quota Management**: Daily and monthly usage quotas
- **Cost Optimization**: Automatically select the most cost-effective model
- **Usage Analytics**: Track usage, costs, and performance metrics

## Authentication

All gateway endpoints require an API key provided via the \`X-API-Key\` header.

Example:
\`\`\`
X-API-Key: bsu_abc123def456...
\`\`\`

Admin endpoints require an admin token via the \`X-Admin-Token\` header.

## Rate Limits

- 100 requests per minute per API key
- Configurable daily and monthly quotas per key
- Rate limit headers included in responses

## Cost Optimization

The gateway can automatically select the optimal model based on task type and budget:

- **Task Types**: chat, code_generation, analysis, search
- **Budget Levels**: low, medium, high

      `,
      contact: {
        name: "BSU Support",
        url: "https://github.com/MOTEB1989/BSM"
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT"
      }
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server"
      },
      {
        url: "https://api.bsu.example.com",
        description: "Production server"
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "API key for authentication"
        },
        AdminAuth: {
          type: "apiKey",
          in: "header",
          name: "X-Admin-Token",
          description: "Admin token for privileged operations"
        }
      },
      schemas: {
        Message: {
          type: "object",
          required: ["role", "content"],
          properties: {
            role: {
              type: "string",
              enum: ["system", "user", "assistant"],
              description: "Message role"
            },
            content: {
              type: "string",
              description: "Message content"
            }
          }
        },
        CompletionRequest: {
          type: "object",
          required: ["messages"],
          properties: {
            messages: {
              type: "array",
              items: { $ref: "#/components/schemas/Message" },
              description: "Array of conversation messages"
            },
            model: {
              type: "string",
              description: "Specific model to use (optional)"
            },
            provider: {
              type: "string",
              enum: ["openai", "anthropic", "google", "perplexity", "kimi"],
              description: "Preferred provider (optional, will use fallback)"
            },
            temperature: {
              type: "number",
              minimum: 0,
              maximum: 2,
              default: 0.7,
              description: "Sampling temperature"
            },
            max_tokens: {
              type: "integer",
              minimum: 1,
              maximum: 4096,
              default: 1200,
              description: "Maximum tokens in response"
            },
            task_type: {
              type: "string",
              enum: ["chat", "code_generation", "analysis", "search"],
              default: "chat",
              description: "Type of task for optimal model selection"
            },
            budget: {
              type: "string",
              enum: ["low", "medium", "high"],
              default: "medium",
              description: "Budget level for model selection"
            },
            use_cache: {
              type: "boolean",
              default: true,
              description: "Whether to use cached responses"
            }
          }
        },
        CompletionResponse: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique request ID"
            },
            object: {
              type: "string",
              default: "chat.completion"
            },
            created: {
              type: "integer",
              description: "Unix timestamp"
            },
            model: {
              type: "string",
              description: "Model used for completion"
            },
            provider: {
              type: "string",
              description: "Provider that served the request"
            },
            choices: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  index: { type: "integer" },
                  message: { $ref: "#/components/schemas/Message" },
                  finish_reason: { type: "string" }
                }
              }
            },
            usage: {
              type: "object",
              properties: {
                prompt_tokens: { type: "integer" },
                completion_tokens: { type: "integer" },
                total_tokens: { type: "integer" }
              }
            },
            citations: {
              type: "array",
              items: { type: "string" }
            },
            from_cache: {
              type: "boolean"
            },
            response_time_ms: {
              type: "integer"
            }
          }
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                message: { type: "string" },
                code: { type: "string" },
                statusCode: { type: "integer" }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: "Gateway",
        description: "Unified AI gateway endpoints"
      },
      {
        name: "Admin",
        description: "Administrative endpoints for gateway management"
      }
    ]
  },
  apis: ["./src/routes/gateway.js", "./src/routes/gatewayAdmin.js"]
};

export const swaggerSpec = swaggerJsdoc(options);
export const swaggerUiSetup = swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "BSU AI Gateway API Docs"
});
export const swaggerUiServe = swaggerUi.serve;
