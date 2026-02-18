/**
 * BSU/LexBANK Unified Frontend Application
 * Vue 3 Chat Interface with Multi-Agent Support
 */

const { createApp } = Vue;

createApp({
  data() {
    return {
      config: window.BSMConfig,
      lang: 'ar',
      selectedAgent: null,
      messages: [],
      input: '',
      loading: false,
      error: null
    };
  },

  mounted() {
    // Load language preference
    const savedLang = localStorage.getItem('bsu_lang');
    if (savedLang) {
      this.lang = savedLang;
      this.updateDirection();
    }

    // Load saved messages
    this.loadMessages();
  },

  methods: {
    toggleLang() {
      this.lang = this.lang === 'ar' ? 'en' : 'ar';
      localStorage.setItem('bsu_lang', this.lang);
      this.updateDirection();
    },

    updateDirection() {
      document.documentElement.setAttribute('lang', this.lang);
      document.documentElement.setAttribute('dir', this.lang === 'ar' ? 'rtl' : 'ltr');
    },

    selectAgent(agentId) {
      this.selectedAgent = agentId;
      this.loadMessages();
    },

    getAgentName(agentId) {
      const agent = this.config.agents[agentId];
      return agent ? agent.name : agentId;
    },

    getAgentProvider(agentId) {
      const agent = this.config.agents[agentId];
      return agent ? agent.provider : '';
    },

    async sendMessage() {
      if (!this.input.trim() || this.loading) return;

      const userMessage = this.input.trim();
      this.input = '';
      this.error = null;

      // Add user message to UI
      this.messages.push({
        role: 'user',
        content: userMessage
      });

      this.loading = true;

      try {
        const endpoint = this.config.agents[this.selectedAgent].endpoint;
        const apiUrl = `${this.config.urls.backend}${endpoint}`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: userMessage,
            language: this.lang,
            history: this.messages.slice(0, -1) // Exclude the just-added user message
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Add assistant response
        this.messages.push({
          role: 'assistant',
          content: data.output || data.message || 'No response'
        });

        // Save messages
        this.saveMessages();

        // Scroll to bottom
        this.$nextTick(() => {
          this.scrollToBottom();
        });

      } catch (err) {
        console.error('Chat error:', err);
        this.error = this.lang === 'ar'
          ? `خطأ في الاتصال: ${err.message}`
          : `Connection error: ${err.message}`;

        // Remove the user message if the request failed
        this.messages.pop();
      } finally {
        this.loading = false;
      }
    },

    clearChat() {
      if (confirm(this.lang === 'ar' ? 'هل تريد مسح جميع الرسائل؟' : 'Clear all messages?')) {
        this.messages = [];
        this.saveMessages();
      }
    },

    formatMessage(content) {
      // Use marked.js for markdown rendering
      if (typeof marked !== 'undefined') {
        return marked.parse(content);
      }
      // Fallback: simple formatting
      return content
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
    },

    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },

    saveMessages() {
      const key = `bsu_messages_${this.selectedAgent}`;
      try {
        localStorage.setItem(key, JSON.stringify(this.messages));
      } catch (e) {
        console.warn('Failed to save messages:', e);
      }
    },

    loadMessages() {
      if (!this.selectedAgent) return;

      const key = `bsu_messages_${this.selectedAgent}`;
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          this.messages = JSON.parse(saved);
        } else {
          this.messages = [];
        }
      } catch (e) {
        console.warn('Failed to load messages:', e);
        this.messages = [];
      }

      this.$nextTick(() => {
        this.scrollToBottom();
      });
    }
  }
}).mount('#app');
