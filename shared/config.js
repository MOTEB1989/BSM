/**
 * BSU/LexBANK Unified Configuration
 * Used by Frontend, Backend, and MCP
 */

const config = {
  // 🔗 System URLs
  urls: {
    // Frontend (GitHub Pages)
    frontend: 'https://moteb1989.github.io/BSM',
    // Main Backend (Render.com)
    backend: 'https://sr-bsm.onrender.com',
    // Agent Management Hub
    corehub: 'https://corehub.nexus',
    // Primary Chat Interface (Nuxt 3)
    lexprim: 'https://lexprim.com',
    // Alternative Cloudflare Pages Deployment
    lexbankPages: 'https://9e71cbf3.lexbank.pages.dev',
    // Repository
    repo: 'https://github.com/MOTEB1989/BSM',
    // Legacy redirect (LexBANK/BSM -> MOTEB1989/BSM)
    legacy: 'https://github.com/LexBANK/BSM'
  },

  // 🤖 AI Models Configuration (9 models)
  models: {
    openai: {
      id: 'openai',
      name: 'OpenAI GPT-4',
      provider: 'OpenAI',
      icon: '🤖',
      color: '#10a37f',
      description: {
        ar: 'أقوى نموذج ذكاء اصطناعي من OpenAI',
        en: 'Most powerful AI model from OpenAI'
      },
      capabilities: ['chat', 'code', 'analysis'],
      available: true
    },
    gemini: {
      id: 'gemini',
      name: 'Google Gemini',
      provider: 'Google',
      icon: '🧠',
      color: '#4285f4',
      description: {
        ar: 'نموذج Google المتقدم متعدد الوسائط',
        en: 'Google advanced multimodal model'
      },
      capabilities: ['chat', 'creative', 'arabic'],
      available: true
    },
    claude: {
      id: 'claude',
      name: 'Claude AI',
      provider: 'Anthropic',
      icon: '🎓',
      color: '#d97757',
      description: {
        ar: 'متخصص في التحليل القانوني والكود',
        en: 'Specialized in legal analysis and code'
      },
      capabilities: ['legal', 'code-review', 'security'],
      available: true
    },
    perplexity: {
      id: 'perplexity',
      name: 'Perplexity',
      provider: 'Perplexity AI',
      icon: '🔍',
      color: '#20808d',
      description: {
        ar: 'بحث مباشر مع مصادر موثوقة',
        en: 'Real-time search with sources'
      },
      capabilities: ['search', 'news', 'facts'],
      available: true
    },
    groq: {
      id: 'groq',
      name: 'Groq LPU',
      provider: 'Groq',
      icon: '⚡',
      color: '#f55036',
      description: {
        ar: 'سرعة فائقة في الاستجابة',
        en: 'Ultra-fast response speed'
      },
      capabilities: ['speed', 'realtime', 'translation'],
      available: true
    },
    kimi: {
      id: 'kimi',
      name: 'KIMI AI',
      provider: 'Moonshot',
      icon: '🌙',
      color: '#7c3aed',
      description: {
        ar: 'متخصص في اللغة الصينية',
        en: 'Chinese language specialist'
      },
      capabilities: ['chinese', 'multilingual'],
      available: true
    },
    cohere: {
      id: 'cohere',
      name: 'Cohere',
      provider: 'Cohere',
      icon: '🔮',
      color: '#39d98a',
      description: {
        ar: 'نماذج لغوية متقدمة',
        en: 'Advanced language models'
      },
      capabilities: ['chat', 'embeddings', 'classification'],
      available: false
    },
    mistral: {
      id: 'mistral',
      name: 'Mistral AI',
      provider: 'Mistral',
      icon: '🌪️',
      color: '#ff7f50',
      description: {
        ar: 'نماذج أوروبية متطورة',
        en: 'Advanced European models'
      },
      capabilities: ['chat', 'reasoning'],
      available: false
    },
    azure: {
      id: 'azure',
      name: 'Azure OpenAI',
      provider: 'Microsoft Azure',
      icon: '☁️',
      color: '#0078d4',
      description: {
        ar: 'OpenAI عبر Azure للمؤسسات',
        en: 'OpenAI via Azure for enterprises'
      },
      capabilities: ['enterprise', 'chat', 'code'],
      available: false
    }
  },

  // 🤖 Agents Configuration (13 agents)
  agents: {
    'agent-auto': {
      id: 'agent-auto',
      name: {
        ar: 'التوجيه التلقائي الذكي',
        en: 'Smart Auto Router'
      },
      description: {
        ar: 'يختار أفضل وكيل تلقائياً بناءً على سؤالك',
        en: 'Automatically selects the best agent for your query'
      },
      icon: '🔄',
      color: '#3b82f6',
      endpoint: '/api/control/run',
      category: 'router',
      recommended: true
    },
    'legal-agent': {
      id: 'legal-agent',
      name: {
        ar: 'الخبير القانوني',
        en: 'Legal Expert'
      },
      description: {
        ar: 'متخصص في الأنظمة والقوانين السعودية',
        en: 'Saudi legal systems specialist'
      },
      icon: '⚖️',
      color: '#10b981',
      endpoint: '/api/control/run',
      category: 'expert',
      recommended: true
    },
    'governance-agent': {
      id: 'governance-agent',
      name: {
        ar: 'خبير الحوكمة',
        en: 'Governance Expert'
      },
      description: {
        ar: 'حوكمة الشركات والمتطلبات التنظيمية',
        en: 'Corporate governance and compliance'
      },
      icon: '🏛️',
      color: '#8b5cf6',
      endpoint: '/api/control/run',
      category: 'expert'
    },
    'security-agent': {
      id: 'security-agent',
      name: {
        ar: 'مدقق الأمان',
        en: 'Security Scanner'
      },
      description: {
        ar: 'فحص الأمان واكتشاف الثغرات',
        en: 'Security audits and vulnerability detection'
      },
      icon: '🔒',
      color: '#ef4444',
      endpoint: '/api/control/run',
      category: 'tools'
    },
    'code-review-agent': {
      id: 'code-review-agent',
      name: {
        ar: 'مراجع الكود',
        en: 'Code Reviewer'
      },
      description: {
        ar: 'مراجعة الأكواد وتحسين الجودة',
        en: 'Code quality and best practices'
      },
      icon: '💻',
      color: '#f59e0b',
      endpoint: '/api/control/run',
      category: 'tools'
    },
    'gemini-agent': {
      id: 'gemini-agent',
      name: {
        ar: 'Google Gemini',
        en: 'Google Gemini'
      },
      description: {
        ar: 'محادثة عربية إبداعية',
        en: 'Creative Arabic conversation'
      },
      icon: '🧠',
      color: '#4285f4',
      endpoint: '/api/control/run',
      category: 'ai-model',
      recommended: true
    },
    'claude-agent': {
      id: 'claude-agent',
      name: {
        ar: 'Claude AI',
        en: 'Claude AI'
      },
      description: {
        ar: 'تحليل قانوني متقدم',
        en: 'Advanced legal analysis'
      },
      icon: '🎓',
      color: '#d97757',
      endpoint: '/api/control/run',
      category: 'ai-model'
    },
    'perplexity-agent': {
      id: 'perplexity-agent',
      name: {
        ar: 'Perplexity',
        en: 'Perplexity'
      },
      description: {
        ar: 'بحث مباشر مع مصادر',
        en: 'Real-time search with sources'
      },
      icon: '🔍',
      color: '#20808d',
      endpoint: '/api/control/run',
      category: 'ai-model'
    },
    'groq-agent': {
      id: 'groq-agent',
      name: {
        ar: 'Groq السريع',
        en: 'Groq Fast'
      },
      description: {
        ar: 'استجابة فورية فائقة السرعة',
        en: 'Ultra-fast instant response'
      },
      icon: '⚡',
      color: '#f55036',
      endpoint: '/api/control/run',
      category: 'ai-model'
    },
    'kimi-agent': {
      id: 'kimi-agent',
      name: {
        ar: 'KIMI AI',
        en: 'KIMI AI'
      },
      description: {
        ar: 'متخصص صيني وعربي',
        en: 'Chinese and Arabic specialist'
      },
      icon: '🌙',
      color: '#7c3aed',
      endpoint: '/api/control/run',
      category: 'ai-model'
    },
    'direct': {
      id: 'direct',
      name: {
        ar: 'دردشة مباشرة',
        en: 'Direct Chat'
      },
      description: {
        ar: 'محادثة مباشرة بدون وكيل',
        en: 'Direct conversation without agent'
      },
      icon: '💬',
      color: '#6366f1',
      endpoint: '/api/chat/direct',
      category: 'basic'
    },
    // raptor-agent is NOT exposed in chat config - restricted to api/ci contexts only (terminal_execution capability)
    'integrity-agent': {
      id: 'integrity-agent',
      name: {
        ar: 'حارس السلامة',
        en: 'Integrity Guardian'
      },
      description: {
        ar: 'مراقبة صحة المستودع',
        en: 'Repository health monitoring'
      },
      icon: '🛡️',
      color: '#14b8a6',
      endpoint: '/api/control/run',
      category: 'tools'
    },
    'pr-merge-agent': {
      id: 'pr-merge-agent',
      name: {
        ar: 'مدير الدمج',
        en: 'Merge Manager'
      },
      description: {
        ar: 'دمج طلبات السحب تلقائياً',
        en: 'Automated PR merging'
      },
      icon: '🔀',
      color: '#06b6d4',
      endpoint: '/api/control/run',
      category: 'tools'
    }
  },

  // 🔒 Security Settings
  security: {
    // Allowed Origins (CORS)
    allowedOrigins: [
      'https://moteb1989.github.io',
      'https://corehub.nexus',
      'https://www.corehub.nexus',
      'https://sr-bsm.onrender.com',
      'https://lexprim.com',
      'https://www.lexprim.com',
      'https://9e71cbf3.lexbank.pages.dev',
      'https://lexdo.uk',
      'https://www.lexdo.uk',
      'http://localhost:3000',
      'https://github.com'
    ],

    // Content Security Policy
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      connectSrc: [
        "'self'",
        'https://sr-bsm.onrender.com',
        'https://api.openai.com',
        'https://api.anthropic.com',
        'https://generativelanguage.googleapis.com',
        'https://api.perplexity.ai',
        'https://api.moonshot.cn'
      ]
    }
  },

  // 📡 MCP Settings (Copilot Integration)
  mcp: {
    serverName: 'lexbank-unified',
    version: '2.0.0',
    transport: 'stdio',
    commands: {
      listAgents: 'agents/list',
      chat: 'agents/chat',
      status: 'agents/status'
    }
  },

  // 🎨 UI Settings
  ui: {
    defaultLanguage: 'ar',
    supportedLanguages: ['ar', 'en'],
    theme: {
      primary: '#4c6ef5',
      secondary: '#868e96',
      success: '#51cf66',
      warning: '#ffd43b',
      danger: '#ff6b6b',
      dark: '#0c0d0e',
      darkBg: '#111827'
    }
  },

  // 📝 UI Text (Bilingual)
  text: {
    ar: {
      appName: 'BSM - البنك الذكي',
      welcome: 'مرحباً بك في النظام الذكي',
      selectAgent: 'اختر الوكيل أو النموذج',
      selectModel: 'اختر نموذج الذكاء الاصطناعي',
      typeMessage: 'اكتب رسالتك...',
      send: 'إرسال',
      loading: 'جارٍ التحميل...',
      thinking: 'يفكر...',
      error: 'حدث خطأ',
      retry: 'إعادة المحاولة',
      clear: 'مسح المحادثة',
      settings: 'الإعدادات',
      status: {
        connected: 'متصل',
        connecting: 'جارٍ الاتصال',
        disconnected: 'غير متصل',
        error: 'خطأ في الاتصال'
      },
      categories: {
        router: 'الموجّهات',
        expert: 'الخبراء',
        tools: 'الأدوات',
        'ai-model': 'نماذج الذكاء الاصطناعي',
        basic: 'الأساسيات'
      }
    },
    en: {
      appName: 'BSM - Smart Bank',
      welcome: 'Welcome to the Smart System',
      selectAgent: 'Select Agent or Model',
      selectModel: 'Select AI Model',
      typeMessage: 'Type your message...',
      send: 'Send',
      loading: 'Loading...',
      thinking: 'Thinking...',
      error: 'Error occurred',
      retry: 'Retry',
      clear: 'Clear Chat',
      settings: 'Settings',
      status: {
        connected: 'Connected',
        connecting: 'Connecting',
        disconnected: 'Disconnected',
        error: 'Connection Error'
      },
      categories: {
        router: 'Routers',
        expert: 'Experts',
        tools: 'Tools',
        'ai-model': 'AI Models',
        basic: 'Basic'
      }
    }
  },

  // 📊 Features
  features: {
    chat: true,
    agents: true,
    knowledge: true,
    orchestrator: true,
    admin: true,
    mcp: true,
    pwa: true,
    multiLanguage: true
  },

  // ========== Helper Functions ==========
  
  /**
   * Auto-detect API URL based on environment
   * @returns {string} API base URL
   */
  getApiUrl() {
    // Local development
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000';
      }
      
      // GitHub Pages
      if (window.location.hostname.includes('github.io')) {
        return this.urls.backend;
      }
      
      // Render.com hosting
      if (window.location.hostname.includes('onrender.com')) {
        return window.location.origin;
      }
    }
    
    // Default to production backend
    return this.urls.backend;
  },

  /**
   * Get available agents by category
   * @param {string} category - Agent category
   * @returns {Array} Agents in category
   */
  getAgentsByCategory(category) {
    return Object.values(this.agents).filter(agent => agent.category === category);
  },

  /**
   * Get available AI models
   * @returns {Array} Available models
   */
  getAvailableModels() {
    return Object.values(this.models).filter(model => model.available);
  },

  /**
   * Get text in specified language
   * @param {string} lang - Language code (ar/en)
   * @returns {object} Text object
   */
  getText(lang = 'ar') {
    return this.text[lang] || this.text.ar;
  }
};

// Export for Node.js (Backend & MCP)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}

// Export for Browser (Frontend)
if (typeof window !== 'undefined') {
  window.BSMConfig = config;
  window.BSM_CONFIG = config;
  window.API_BASE = config.getApiUrl();
  window.BSM_AGENTS = config.agents;
  window.BSM_MODELS = config.models;
  
  // Log configuration loaded
  console.log('🚀 BSM Unified Platform Configuration Loaded');
  console.log('📡 API URL:', window.API_BASE);
  console.log('🤖 Agents:', Object.keys(config.agents).length);
  console.log('🧠 Models:', Object.keys(config.models).length);
}
