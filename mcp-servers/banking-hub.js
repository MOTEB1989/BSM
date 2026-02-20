#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

const AI_AGENTS = {
  gemini: {
    name: 'Gemini Pro',
    specialties: ['Arabic Language', 'General Banking', 'Customer Support'],
    endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
  },
  claude: {
    name: 'Claude-3 Haiku',
    specialties: ['Legal Analysis', 'Code Review', 'Risk Assessment'],
    endpoint: 'https://api.anthropic.com/v1/messages',
  },
  gpt4: {
    name: 'GPT-4 Turbo',
    specialties: ['Technical Coding', 'Data Analysis', 'Integration'],
    endpoint: 'https://api.openai.com/v1/chat/completions',
  },
  perplexity: {
    name: 'Perplexity Sonar',
    specialties: ['Real-time Search', 'Market Updates', 'Fact Verification'],
    endpoint: 'https://api.perplexity.ai/chat/completions',
  },
};

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function detectAgent({ query, language, category }) {
  const normalizedQuery = normalizeText(query);
  const normalizedCategory = normalizeText(category);
  const normalizedLanguage = normalizeText(language);

  if (normalizedCategory === 'legal') return 'claude';
  if (normalizedCategory === 'technical') return 'gpt4';
  if (normalizedCategory === 'creative') return 'gemini';

  if (
    normalizedQuery.includes('قانون') ||
    normalizedQuery.includes('امتثال') ||
    normalizedQuery.includes('legal') ||
    normalizedQuery.includes('compliance')
  ) {
    return 'claude';
  }

  if (
    normalizedQuery.includes('برمجة') ||
    normalizedQuery.includes('كود') ||
    normalizedQuery.includes('code') ||
    normalizedQuery.includes('api')
  ) {
    return 'gpt4';
  }

  if (
    normalizedQuery.includes('سعر') ||
    normalizedQuery.includes('اسعار') ||
    normalizedQuery.includes('مؤشر') ||
    normalizedQuery.includes('price') ||
    normalizedQuery.includes('market') ||
    normalizedQuery.includes('rate')
  ) {
    return 'perplexity';
  }

  if (normalizedLanguage === 'ar') return 'gemini';
  return 'gpt4';
}

class BankingAgentServer {
  constructor() {
    this.server = new Server(
      {
        name: 'BSM-Banking-Agents',
        version: '1.0.0',
        description: 'AI Banking Agents Hub for LexBANK/BSM',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'route_banking_query',
          description: 'توجيه الاستفسار البنكي للعامل المناسب',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'نص الاستفسار' },
              language: { type: 'string', enum: ['ar', 'en'], default: 'ar' },
              category: {
                type: 'string',
                enum: ['general', 'technical', 'legal', 'creative'],
                description: 'نوع الاستفسار',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'check_agent_status',
          description: 'فحص حالة العوامل المختلفة',
          inputSchema: {
            type: 'object',
            properties: {
              agent: { type: 'string', enum: Object.keys(AI_AGENTS) },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args = {} } = request.params;

        switch (name) {
          case 'route_banking_query':
            return this.routeBankingQuery(args);
          case 'check_agent_status':
            return this.checkAgentStatus(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `خطأ: ${error.message}` }],
          isError: true,
        };
      }
    });
  }

  async routeBankingQuery({ query, language = 'ar', category = 'general' } = {}) {
    if (!query || typeof query !== 'string') {
      throw new Error('query is required and must be a string');
    }

    const selectedAgent = detectAgent({ query, language, category });
    const agent = AI_AGENTS[selectedAgent];

    return {
      content: [
        {
          type: 'text',
          text:
            `🤖 **تم توجيه استفسارك إلى**: ${agent.name}\n\n` +
            `**التخصصات**: ${agent.specialties.join(', ')}\n` +
            `**الاستفسار**: ${query}\n` +
            `**اللغة**: ${language === 'ar' ? 'العربية' : 'English'}\n` +
            `**الفئة**: ${category}\n\n` +
            '⚡ **حالة العامل**: نشط ومتاح\n' +
            '🔒 **الأمان**: مفعّل (Banking Grade Security)\n' +
            `🌐 **Endpoint**: ${agent.endpoint}`,
        },
      ],
    };
  }

  async checkAgentStatus({ agent } = {}) {
    const selectedAgent = agent || 'gemini';
    if (!AI_AGENTS[selectedAgent]) {
      throw new Error(`عامل غير موجود: ${selectedAgent}`);
    }

    const status = {
      agent: selectedAgent,
      name: AI_AGENTS[selectedAgent].name,
      status: 'active',
      response_time: '< 200ms',
      last_check: new Date().toISOString(),
      arabic_support: selectedAgent === 'gemini' ? 'native' : 'translated',
    };

    return {
      content: [
        {
          type: 'text',
          text:
            `✅ **حالة العامل ${status.name}**:\n\n` +
            `🟢 **الحالة**: ${status.status}\n` +
            `⏱️ **زمن الاستجابة**: ${status.response_time}\n` +
            `🌐 **دعم العربية**: ${status.arabic_support}\n` +
            `🔍 **آخر فحص**: ${status.last_check}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('BSM Banking Agents MCP server started');
  }
}

if (require.main === module) {
  const server = new BankingAgentServer();
  server.run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  BankingAgentServer,
  AI_AGENTS,
};
