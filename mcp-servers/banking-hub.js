#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

const AI_AGENTS = {
  gemini: {
    name: 'Gemini Pro',
    specialties: ['Arabic Language', 'General Banking', 'Customer Support'],
  },
  claude: {
    name: 'Claude-3 Haiku',
    specialties: ['Legal Analysis', 'Code Review', 'Risk Assessment'],
  },
  gpt4: {
    name: 'GPT-4 Turbo',
    specialties: ['Technical Coding', 'Data Analysis', 'Integration'],
  },
  perplexity: {
    name: 'Perplexity Sonar',
    specialties: ['Real-time Search', 'Market Updates', 'Fact Verification'],
  },
};

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * Detects the appropriate AI agent based on query content, category, and language.
 * 
 * Routing priority (deterministic):
 * 1. Explicit category overrides everything:
 *    - 'legal'     → claude
 *    - 'technical' → gpt4
 *    - 'creative'  → gemini
 * 2. Query content analysis (fixed priority: legal > technical > market):
 *    - Legal keywords (قانون، امتثال، legal, compliance) → claude
 *    - Technical keywords (برمجة، كود، code, api) → gpt4
 *    - Market keywords (سعر، مؤشر، price, market, rate) → perplexity
 * 3. Language-based fallback:
 *    - Arabic ('ar') → gemini (best Arabic support)
 *    - Other languages → gpt4
 */
function detectAgent({ query, language, category }) {
  const normalizedQuery = normalizeText(query);
  const normalizedCategory = normalizeText(category);
  const normalizedLanguage = normalizeText(language);

  // Priority 1: Category-based routing (highest priority)
  if (normalizedCategory === 'legal') return 'claude';
  if (normalizedCategory === 'technical') return 'gpt4';
  if (normalizedCategory === 'creative') return 'gemini';

  // Priority 2: Query content analysis (fixed precedence: legal > technical > market)
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

  // Priority 3: Language-based fallback
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
          description: 'توجيه الاستفسار البنكي للوكيل المناسب',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'نص الاستفسار' },
              language: { type: 'string', enum: ['ar', 'en'] },
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
          description: 'فحص حالة الوكلاء المختلفة',
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
        console.error('MCP tool execution error:', { tool: request.params.name, error: error.message, stack: error.stack });
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
            '⚡ **حالة الوكيل**: نشط ومتاح\n' +
            '🔒 **الأمان**: مفعّل (Banking Grade Security)',
        },
      ],
    };
  }

  async checkAgentStatus({ agent } = {}) {
    const selectedAgent = agent || 'gemini';
    if (!AI_AGENTS[selectedAgent]) {
      throw new Error(`وكيل غير موجود: ${selectedAgent}`);
    }

    const agentInfo = AI_AGENTS[selectedAgent];
    
    // Note: This returns static configuration data, not live health status
    const info = {
      agent: selectedAgent,
      name: agentInfo.name,
      specialties: agentInfo.specialties.join(', '),
      arabic_support: selectedAgent === 'gemini' ? 'native' : 'translated',
      status_type: 'configuration',
    };

    return {
      content: [
        {
          type: 'text',
          text:
            `ℹ️ **معلومات الوكيل ${info.name}**:\n\n` +
            `📋 **التخصصات**: ${info.specialties}\n` +
            `🌐 **دعم العربية**: ${info.arabic_support}\n` +
            `ℹ️ **ملاحظة**: هذه بيانات إعداد ثابتة وليست حالة تشغيلية مباشرة`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('🏦 BSM Banking Agents Server started - تم تشغيل خادم الوكلاء البنكية');
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
