#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');
const fetch = require('node-fetch');

// إعداد الاتصال بـ LexBANK Backend
const LEXBANK_BASE = process.env.API_BASE || 'https://sr-bsm.onrender.com/api';

class LexBANKMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'lexbank-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {
            // تفعيل جميع الوكلاء
            'gemini-chat': true,
            'claude-chat': true,
            'perplexity-search': true,
            'gpt-chat': true,
            'kimi-chat': true,
            'agent-status': true,
            'banking-query': true
          },
          resources: {
            // الوصول للبيانات
            'agent-registry': true,
            'chat-history': true,
            'banking-docs': true
          }
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    // قائمة الأدوات المتاحة للـ Copilot
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'gemini_chat',
            description: 'الدردشة مع وكيل Gemini للاستفسارات العامة والإبداعية',
            inputSchema: {
              type: 'object',
              properties: {
                message: { type: 'string', description: 'الرسالة المرسلة لوكيل Gemini' },
                temperature: { type: 'number', default: 0.7 }
              },
              required: ['message']
            }
          },
          {
            name: 'claude_chat',
            description: 'الدردشة مع وكيل Claude للتحليل القانوني والعميق',
            inputSchema: {
              type: 'object',
              properties: {
                message: { type: 'string', description: 'الاستفسار القانوني أو التحليلي' },
                history: { type: 'array', description: 'سجل المحادثة السابق' }
              },
              required: ['message']
            }
          },
          {
            name: 'perplexity_search',
            description: 'البحث المباشر في الإنترنت عبر Perplexity للمعلومات المالية الحديثة',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'استعلام البحث' },
                model: { type: 'string', enum: ['fast', 'balanced', 'pro'], default: 'balanced' }
              },
              required: ['query']
            }
          },
          {
            name: 'gpt_chat',
            description: 'الدردشة مع GPT-4 للاستشارات التقنية المعقدة',
            inputSchema: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                context: { type: 'string', description: 'سياق إضافي للمحادثة' }
              },
              required: ['message']
            }
          },
          {
            name: 'check_agents_status',
            description: 'فحص حالة جميع الوكلاء (Online/Offline)',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'banking_knowledge_query',
            description: 'الاستعلام من قاعدة معارف LexBANK البنكية',
            inputSchema: {
              type: 'object',
              properties: {
                question: { type: 'string', description: 'السؤال حول اللوائح البنكية أو الإجراءات' },
                category: { type: 'string', enum: ['general', 'legal', 'technical', 'compliance'], default: 'general' }
              },
              required: ['question']
            }
          }
        ]
      };
    });

    // معالجة استدعاء الأدوات
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'gemini_chat':
            return await this.callAgent('gemini-agent', args);
          
          case 'claude_chat':
            return await this.callAgent('claude-agent', args);
          
          case 'perplexity_search':
            return await this.callPerplexity(args);
          
          case 'gpt_chat':
            return await this.callAgent('gpt-agent', args);
          
          case 'check_agents_status':
            return await this.checkAllAgents();
          
          case 'banking_knowledge_query':
            return await this.queryBankingKnowledge(args);
          
          default:
            throw new Error(`Tool ${name} not found`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  setupResourceHandlers() {
    // الموارد المتاحة (قابل للقراءة فقط)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'lexbank://agents/registry',
            name: 'Agent Registry',
            description: 'سجل جميع الوكلاء المتاحين في النظام',
            mimeType: 'application/json'
          },
          {
            uri: 'lexbank://docs/banking-laws',
            name: 'Banking Laws Documentation',
            description: 'القوانين البنكية السعودية (SAMA)',
            mimeType: 'text/markdown'
          },
          {
            uri: 'lexbank://config/security',
            name: 'Security Configuration',
            description: 'إعدادات الأمان الحالية',
            mimeType: 'application/json'
          }
        ]
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      
      if (uri === 'lexbank://agents/registry') {
        const agents = await this.fetchAgentRegistry();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(agents, null, 2)
            }
          ]
        };
      }
      
      throw new Error(`Resource ${uri} not found`);
    });
  }

  // Helper Methods
  async callAgent(agentName, args) {
    const response = await fetch(`${LEXBANK_BASE}/chat/${agentName.replace('-agent', '')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    
    if (!response.ok) throw new Error(`Agent ${agentName} failed: ${response.status}`);
    
    const data = await response.json();
    return {
      content: [
        {
          type: 'text',
          text: data.response || data.content || JSON.stringify(data)
        }
      ]
    };
  }

  async callPerplexity(args) {
    const response = await fetch(`${LEXBANK_BASE}/chat/perplexity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: args.query,
        model: args.model
      })
    });
    
    const data = await response.json();
    return {
      content: [
        {
          type: 'text',
          text: `${data.response}\n\nمصادر: ${(data.citations || []).join(', ')}`
        }
      ]
    };
  }

  async checkAllAgents() {
    const response = await fetch(`${LEXBANK_BASE}/agents/status`);
    const status = await response.json();
    
    const statusText = Object.entries(status.agents || {})
      .map(([name, info]) => `${name}: ${info.status}`)
      .join('\n');
    
    return {
      content: [
        {
          type: 'text',
          text: `حالة الوكلاء:\n${statusText}`
        }
      ]
    };
  }

  async queryBankingKnowledge(args) {
    // محاكاة قاعدة المعرفة البنكية
    const mockResponses = {
      general: 'وفقاً للوائح SAMA، يجب على البنوك...',
      legal: 'الإطار القانوني للخدمات المصرفية ينص على...',
      technical: 'البنية التحتية التقنية المطلوبة هي...'
    };
    
    return {
      content: [
        {
          type: 'text',
          text: mockResponses[args.category] || mockResponses.general
        }
      ]
    };
  }

  async fetchAgentRegistry() {
    // جلب قائمة الوكلاء من BSU
    return {
      agents: ['gemini-agent', 'claude-agent', 'perplexity-agent', 'gpt-agent', 'kimi-agent'],
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('LexBANK MCP Server running on stdio');
  }
}

const server = new LexBANKMCPServer();
server.run().catch(console.error);
