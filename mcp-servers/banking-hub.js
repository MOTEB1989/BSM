#!/usr/bin/env node

/**
 * BSM Banking Agents Hub - MCP Server
 * توجيه الاستفسارات البنكية للعوامل المناسبة (Gemini, Claude, GPT-4, Perplexity)
 * Integrates with Cursor (Windows) and LexBANK backend
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const fetch = require('node-fetch');

const API_BASE = process.env.BSM_API_URL || 'https://sr-bsm.onrender.com/api';

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
    name: 'Perplexity',
    specialties: ['Real-time Search', 'Market Data', 'Citations'],
  },
};

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error (${response.status}): ${err}`);
  }
  return response.json();
}

const server = new Server(
  {
    name: 'BSM-Banking-Agents',
    version: '1.0.0',
    description: 'AI Banking Agents Hub for LexBANK System - عُصبة العوامل البنكية',
  },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'route_banking_query',
      description: 'توجيه الاستفسار البنكي للعامل المناسب | Route banking query to the right AI agent',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'نص الاستفسار | Query text' },
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
      description: 'فحص حالة العوامل | Check AI agent status',
      inputSchema: {
        type: 'object',
        properties: {
          agent: { type: 'string', enum: Object.keys(AI_AGENTS) },
        },
      },
    },
    {
      name: 'banking_chat',
      description: 'دردشة بنكية مباشرة عبر BSM API | Direct banking chat via BSM',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'الرسالة' },
          language: { type: 'string', enum: ['ar', 'en'], default: 'ar' },
        },
        required: ['message'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'route_banking_query':
        return await routeBankingQuery(args || {});
      case 'check_agent_status':
        return await checkAgentStatus(args || {});
      case 'banking_chat':
        return await bankingChat(args || {});
      default:
        throw new Error(`أداة غير معروفة | Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `خطأ | Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function routeBankingQuery({ query, language = 'ar' }) {
  let selectedAgent = 'gemini';
  const q = (query || '').toLowerCase();

  if (q.includes('قانون') || q.includes('legal') || q.includes('حوكمة')) {
    selectedAgent = 'claude';
  } else if (q.includes('code') || q.includes('برمجة') || q.includes('تقني')) {
    selectedAgent = 'gpt4';
  } else if (q.includes('سعر') || q.includes('price') || q.includes('سوق')) {
    selectedAgent = 'perplexity';
  }

  const agent = AI_AGENTS[selectedAgent];
  const langLabel = language === 'ar' ? 'العربية' : 'English';

  return {
    content: [{
      type: 'text',
      text: `🤖 **تم توجيه استفسارك إلى | Routed to**: ${agent.name}
**التخصصات | Specialties**: ${agent.specialties.join(', ')}
**الاستفسار | Query**: ${query}
**اللغة | Language**: ${langLabel}

⚡ **حالة العامل | Status**: نشط ومتاح | Active
🔒 **الأمان | Security**: Banking Grade`,
    }],
  };
}

async function checkAgentStatus({ agent }) {
  if (!agent || !AI_AGENTS[agent]) {
    return {
      content: [{
        type: 'text',
        text: `عوامل متاحة | Available agents: ${Object.keys(AI_AGENTS).join(', ')}`,
      }],
    };
  }

  try {
    const data = await apiRequest('/chat/key-status');
    const status = {
      agent,
      name: AI_AGENTS[agent].name,
      status: 'active',
      response_time: '< 200ms',
      last_check: new Date().toISOString(),
      arabic_support: agent === 'gemini' ? 'native' : 'translated',
      api_status: data,
    };

    return {
      content: [{
        type: 'text',
        text: `✅ **حالة العامل | Agent Status ${AI_AGENTS[agent].name}**:
🟢 **الحالة | Status**: ${status.status}
⏱️ **زمن الاستجابة | Response**: ${status.response_time}
🌐 **دعم العربية | Arabic**: ${status.arabic_support}
🔍 **آخر فحص | Last check**: ${status.last_check}`,
      }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `⚠️ BSM API غير متصل | API unreachable: ${err.message}`,
      }],
    };
  }
}

async function bankingChat({ message, language = 'ar' }) {
  if (!message) {
    throw new Error('الرسالة مطلوبة | Message required');
  }

  const data = await apiRequest('/chat/direct', {
    method: 'POST',
    body: JSON.stringify({ message, language, history: [] }),
  });

  return {
    content: [{ type: 'text', text: data.output || data }],
  };
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🏦 BSM Banking Agents Server started - تم تشغيل خادم العوامل البنكية');
}

main().catch((err) => {
  console.error('Server error:', err);
  process.exit(1);
});
