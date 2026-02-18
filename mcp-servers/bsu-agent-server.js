#!/usr/bin/env node

/**
 * BSU/LexBANK MCP Server for GitHub Copilot
 * Provides unified access to AI agents via Model Context Protocol
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const fetch = require('node-fetch');
const config = require('../shared/config.js');

// API Base URL
const API_BASE = process.env.BSM_API_URL || 'https://sr-bsm.onrender.com/api';

// Create MCP Server
const server = new Server(
  {
    name: config.mcp.serverName,
    version: config.mcp.version,
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

/**
 * Helper: Make API request
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_agents',
        description: 'List all available AI agents',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'chat_gpt',
        description: 'Chat with GPT-4 directly (supports Arabic and English)',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'User message',
            },
            language: {
              type: 'string',
              enum: ['ar', 'en'],
              description: 'Language (ar=Arabic, en=English)',
              default: 'ar',
            },
            history: {
              type: 'array',
              description: 'Conversation history',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string' },
                  content: { type: 'string' },
                },
              },
              default: [],
            },
          },
          required: ['message'],
        },
      },
      {
        name: 'chat_gemini',
        description: 'Chat with Google Gemini AI',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'User message',
            },
            language: {
              type: 'string',
              enum: ['ar', 'en'],
              default: 'ar',
            },
          },
          required: ['message'],
        },
      },
      {
        name: 'chat_claude',
        description: 'Chat with Anthropic Claude AI',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'User message',
            },
            language: {
              type: 'string',
              enum: ['ar', 'en'],
              default: 'ar',
            },
          },
          required: ['message'],
        },
      },
      {
        name: 'chat_perplexity',
        description: 'Chat with Perplexity AI (with web search and citations)',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'User message',
            },
            language: {
              type: 'string',
              enum: ['ar', 'en'],
              default: 'ar',
            },
          },
          required: ['message'],
        },
      },
      {
        name: 'chat_kimi',
        description: 'Chat with Moonshot Kimi AI',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'User message',
            },
            language: {
              type: 'string',
              enum: ['ar', 'en'],
              default: 'ar',
            },
          },
          required: ['message'],
        },
      },
      {
        name: 'get_key_status',
        description: 'Check status of all AI service API keys',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

/**
 * Execute tool
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_agents': {
        const data = await apiRequest('/agents');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'chat_gpt': {
        const { message, language = 'ar', history = [] } = args;
        const data = await apiRequest('/chat/direct', {
          method: 'POST',
          body: JSON.stringify({ message, language, history }),
        });
        return {
          content: [
            {
              type: 'text',
              text: data.output,
            },
          ],
        };
      }

      case 'chat_gemini':
      case 'chat_claude':
      case 'chat_perplexity':
      case 'chat_kimi': {
        const { message, language = 'ar' } = args;
        const endpoint = config.agents[name.replace('chat_', '')].endpoint;
        const data = await apiRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify({ message, language }),
        });
        return {
          content: [
            {
              type: 'text',
              text: data.output,
            },
          ],
        };
      }

      case 'get_key_status': {
        const data = await apiRequest('/chat/key-status');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * List available resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'bsu://config',
        name: 'BSU Configuration',
        mimeType: 'application/json',
        description: 'Unified configuration for BSU/LexBANK platform',
      },
      {
        uri: 'bsu://agents',
        name: 'Available Agents',
        mimeType: 'application/json',
        description: 'List of all available AI agents',
      },
      {
        uri: 'bsu://status',
        name: 'System Status',
        mimeType: 'application/json',
        description: 'Current system status and API key availability',
      },
    ],
  };
});

/**
 * Read resource
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    switch (uri) {
      case 'bsu://config': {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(config, null, 2),
            },
          ],
        };
      }

      case 'bsu://agents': {
        const data = await apiRequest('/agents');
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'bsu://status': {
        const data = await apiRequest('/chat/key-status');
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  } catch (error) {
    throw new Error(`Failed to read resource: ${error.message}`);
  }
});

/**
 * Start server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('BSU MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
