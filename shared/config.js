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

  // 🤖 Agent Settings (Unified)
  agents: {
    gemini: {
      name: 'gemini-agent',
      provider: 'Google',
      model: 'gemini-2.0-flash-exp',
      endpoint: '/api/chat/gemini',
      status: 'active'
    },
    claude: {
      name: 'claude-agent',
      provider: 'Anthropic',
      model: 'claude-3-5-sonnet-20241022',
      endpoint: '/api/chat/claude',
      status: 'active'
    },
    perplexity: {
      name: 'perplexity-agent',
      provider: 'Perplexity',
      model: 'sonar-pro',
      endpoint: '/api/chat/perplexity',
      status: 'active'
    },
    gpt: {
      name: 'gpt-agent',
      provider: 'OpenAI',
      model: 'gpt-4',
      endpoint: '/api/chat/direct',
      status: 'active'
    },
    kimi: {
      name: 'kimi-agent',
      provider: 'Moonshot',
      model: 'kimi-latest',
      endpoint: '/api/chat/kimi',
      status: 'active'
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
  }
};

// Export for Node.js (Backend & MCP)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}

// Export for Browser (Frontend)
if (typeof window !== 'undefined') {
  window.BSMConfig = config;
}
