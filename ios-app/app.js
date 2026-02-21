// CoreHub Nexus iOS App - Main Application Logic
const { createApp } = Vue;

createApp({
  data() {
    return {
      lang: 'ar',
      mode: 'agent-auto',
      input: '',
      messages: [],
      loading: false,
      error: '',
      isOnline: navigator.onLine,
      showModeMenu: false,
      apiBaseUrl: window.location.origin || 'https://sr-bsm.onrender.com',
      quickActions: [
        { icon: '💬', text: 'مساعدة عامة' },
        { icon: '⚖️', text: 'استشارة قانونية' },
        { icon: '📊', text: 'تحليل بيانات' },
        { icon: '🔐', text: 'أمان ومطابقة' },
      ]
    };
  },
  
  computed: {
    currentModeLabel() {
      const labels = {
        'agent-auto': this.lang === 'ar' ? 'ذكي' : 'Smart',
        'direct': this.lang === 'ar' ? 'مباشر' : 'Direct',
        'legal-agent': this.lang === 'ar' ? 'قانوني' : 'Legal',
        'governance-agent': this.lang === 'ar' ? 'حوكمة' : 'Governance'
      };
      return labels[this.mode] || this.mode;
    }
  },
  
  mounted() {
    this.loadFromStorage();
    this.setupOnlineListener();
    this.focusInput();
    
    // Detect API base URL from meta tag or use default
    const apiMetaTag = document.querySelector('meta[name="api-base-url"]');
    if (apiMetaTag) {
      this.apiBaseUrl = apiMetaTag.getAttribute('content');
    }
    
    console.log('✅ CoreHub Nexus iOS App initialized');
    console.log('📡 API Base URL:', this.apiBaseUrl);
    console.log('🌐 Online:', this.isOnline);
  },
  
  methods: {
    toggleLang() {
      this.lang = this.lang === 'ar' ? 'en' : 'ar';
      this.saveToStorage();
      
      // Update quick actions based on language
      this.quickActions = this.lang === 'ar' ? [
        { icon: '💬', text: 'مساعدة عامة' },
        { icon: '⚖️', text: 'استشارة قانونية' },
        { icon: '📊', text: 'تحليل بيانات' },
        { icon: '🔐', text: 'أمان ومطابقة' },
      ] : [
        { icon: '💬', text: 'General Help' },
        { icon: '⚖️', text: 'Legal Consultation' },
        { icon: '📊', text: 'Data Analysis' },
        { icon: '🔐', text: 'Security & Compliance' },
      ];
    },
    
    setMode(newMode) {
      this.mode = newMode;
      this.showModeMenu = false;
      this.saveToStorage();
      console.log('Mode changed to:', newMode);
    },
    
    clearChat() {
      if (this.messages.length > 0) {
        const confirmed = confirm(
          this.lang === 'ar' 
            ? 'هل تريد حذف جميع الرسائل؟' 
            : 'Delete all messages?'
        );
        if (!confirmed) return;
      }
      
      this.messages = [];
      this.error = '';
      this.saveToStorage();
      this.focusInput();
      console.log('Chat cleared');
    },
    
    async sendMessage() {
      if (!this.input.trim() || this.loading) return;
      
      const userMessage = this.input.trim();
      this.input = '';
      
      // Add user message
      this.messages.push({
        role: 'user',
        content: userMessage,
        time: Date.now()
      });
      
      this.saveToStorage();
      this.scrollToBottom();
      
      // Check if online
      if (!this.isOnline) {
        await this.queueOfflineMessage(userMessage);
        this.error = this.lang === 'ar'
          ? 'أنت غير متصل. تم حفظ رسالتك وستُرسل تلقائياً عند استعادة الاتصال.'
          : 'You are offline. Your message has been saved and will be sent automatically when the connection is restored.';
        return;
      }
      
      this.loading = true;
      this.error = '';
      
      try {
        const response = await this.callAPI(userMessage);
        
        // Add assistant response
        this.messages.push({
          role: 'assistant',
          content: response,
          time: Date.now()
        });
        
        this.saveToStorage();
        this.scrollToBottom();
        
      } catch (err) {
        console.error('API Error:', err);
        this.error = this.lang === 'ar'
          ? `حدث خطأ: ${err.message}`
          : `Error: ${err.message}`;
      } finally {
        this.loading = false;
        this.focusInput();
      }
    },
    
    async callAPI(message) {
      const endpoint = this.mode === 'direct' 
        ? `${this.apiBaseUrl}/api/chat/direct`
        : `${this.apiBaseUrl}/api/chat`;
      
      const payload = {
        message: message,
        language: this.lang,
        history: this.messages.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      };
      
      if (this.mode !== 'direct') {
        payload.destination = this.mode;
      }
      
      console.log('📤 Sending request to:', endpoint);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || 
            `HTTP ${response.status}: ${response.statusText}`
          );
        }
        
        const data = await response.json();
        console.log('📥 Response received');
        
        return data.response || data.message || 'لم يتم الحصول على رد';
        
      } catch (err) {
        if (err.name === 'AbortError') {
          throw new Error(
            this.lang === 'ar' 
              ? 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.' 
              : 'Request timeout. Please try again.'
          );
        }
        throw err;
      }
    },
    
    sendQuickAction(text) {
      this.input = text;
      this.sendMessage();
    },
    
    handleKeyDown(e) {
      // Send on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    },
    
    renderMarkdown(content) {
      if (!content) return '';
      try {
        marked.setOptions({
          breaks: true,
          gfm: true,
          headerIds: false,
          mangle: false
        });
        return marked.parse(content);
      } catch (e) {
        console.error('Markdown parse error:', e);
        return content;
      }
    },
    
    formatTime(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return this.lang === 'ar' ? 'الآن' : 'now';
      if (diffMins < 60) return `${diffMins}${this.lang === 'ar' ? 'د' : 'm'}`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}${this.lang === 'ar' ? 'س' : 'h'}`;
      
      return date.toLocaleDateString(this.lang === 'ar' ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric'
      });
    },
    
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },
    
    handleScroll() {
      // Handle scroll events if needed (e.g., load more messages)
    },
    
    focusInput() {
      this.$nextTick(() => {
        const input = this.$refs.inputField;
        if (input) {
          input.focus();
        }
      });
    },
    
    async queueOfflineMessage(message) {
      await new Promise((resolve, reject) => {
        const request = indexedDB.open('corehub-nexus-offline', 1);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('pending-messages')) {
            db.createObjectStore('pending-messages', { keyPath: 'id', autoIncrement: true });
          }
        };

        request.onsuccess = (event) => {
          const db = event.target.result;
          const tx = db.transaction('pending-messages', 'readwrite');
          tx.objectStore('pending-messages').add({
            message,
            mode: this.mode,
            language: this.lang,
            timestamp: Date.now()
          });
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };

        request.onerror = () => reject(request.error);
      });

      // Register background sync so messages are sent when back online
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register('sync-messages');
          console.log('[App] Background sync registered for offline messages');
        } catch (err) {
          console.error('[App] Background sync registration failed:', err);
        }
      }
    },

    setupOnlineListener() {
      window.addEventListener('online', () => {
        this.isOnline = true;
        console.log('📶 Connection restored');
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
        console.log('📵 Connection lost');
      });
    },
    
    saveToStorage() {
      try {
        const state = {
          lang: this.lang,
          mode: this.mode,
          messages: this.messages.slice(-50) // Keep last 50 messages
        };
        localStorage.setItem('corehub-nexus-state', JSON.stringify(state));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    },
    
    loadFromStorage() {
      try {
        const saved = localStorage.getItem('corehub-nexus-state');
        if (saved) {
          const state = JSON.parse(saved);
          this.lang = state.lang || 'ar';
          this.mode = state.mode || 'agent-auto';
          this.messages = state.messages || [];
          console.log('✅ State loaded from storage');
        }
      } catch (e) {
        console.error('Failed to load from localStorage:', e);
      }
    }
  }
}).mount('#app');
