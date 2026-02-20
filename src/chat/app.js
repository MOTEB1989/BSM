const { createApp, ref, computed, nextTick, onMounted } = Vue;

// Detect API base URL - same origin when served from Express, configurable for standalone
const API_BASE = window.__LEXBANK_API_URL__ || '';

createApp({
  setup() {
    const messages = ref([]);
    const input = ref('');
    const loading = ref(false);
    const error = ref('');
    const lang = ref('ar');
    const mode = ref('agent-auto');
    const showModeMenu = ref(false);
    const messagesContainer = ref(null);
    const inputField = ref(null);

    const quickActions = computed(() => {
      if (lang.value === 'ar') {
        return [
          { icon: '\u2696\uFE0F', text: '\u0645\u0627 \u0647\u064A \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0634\u0631\u0643\u0627\u062A \u0641\u064A \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629\u061F' },
          { icon: '\uD83D\uDCC4', text: '\u0633\u0627\u0639\u062F\u0646\u064A \u0641\u064A \u0635\u064A\u0627\u063A\u0629 \u0639\u0642\u062F' },
          { icon: '\uD83C\uDFE2', text: '\u0645\u0627 \u0647\u064A \u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062D\u0648\u0643\u0645\u0629\u061F' },
          { icon: '\uD83D\uDCA1', text: '\u0627\u0634\u0631\u062D \u0644\u064A \u0646\u0638\u0627\u0645 \u0627\u0644\u0625\u0641\u0644\u0627\u0633' }
        ];
      }
      return [
        { icon: '\u2696\uFE0F', text: 'What are company types in Saudi Arabia?' },
        { icon: '\uD83D\uDCC4', text: 'Help me draft a contract' },
        { icon: '\uD83C\uDFE2', text: 'What are governance requirements?' },
        { icon: '\uD83D\uDCA1', text: 'Explain the bankruptcy system' }
      ];
    });

    const currentModeLabel = computed(() => {
      const labels = {
        'agent-auto': lang.value === 'ar' ? '\u0630\u0643\u064A (\u062A\u0644\u0642\u0627\u0626\u064A)' : 'Smart (Auto)',
        direct: lang.value === 'ar' ? '\u062F\u0631\u062F\u0634\u0629 \u0645\u0628\u0627\u0634\u0631\u0629' : 'Direct Chat',
        'legal-agent': lang.value === 'ar' ? '\u0627\u0644\u0648\u0643\u064A\u0644 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064A' : 'Legal Agent',
        'governance-agent': lang.value === 'ar' ? '\u0648\u0643\u064A\u0644 \u0627\u0644\u062D\u0648\u0643\u0645\u0629' : 'Governance Agent'
      };
      return labels[mode.value] || labels['agent-auto'];
    });

    function toggleLang() {
      lang.value = lang.value === 'ar' ? 'en' : 'ar';
      document.documentElement.lang = lang.value;
      document.documentElement.dir = lang.value === 'ar' ? 'rtl' : 'ltr';
      document.body.dir = lang.value === 'ar' ? 'rtl' : 'ltr';
    }

    function setMode(m) {
      mode.value = m;
      showModeMenu.value = false;
    }

    function clearChat() {
      messages.value = [];
      error.value = '';
      nextTick(() => inputField.value?.focus());
    }

    function formatTime(time) {
      if (!time) return '';
      const d = new Date(time);
      return d.toLocaleTimeString(lang.value === 'ar' ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderMarkdown(text) {
      if (!text) return '';
      try {
        // Prevent raw HTML/script injection while keeping markdown formatting.
        return marked.parse(escapeHtml(text), { breaks: true, gfm: true });
      } catch {
        return text;
      }
    }

    function scrollToBottom() {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      });
    }

    function handleScroll() {
      // Could track scroll position for "scroll to bottom" button
    }

    function handleEnter(e) {
      if (!e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    }

    function autoResize() {
      const el = inputField.value;
      if (el) {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 128) + 'px';
      }
    }

    function sendQuickAction(text) {
      input.value = text;
      sendMessage();
    }

    async function sendMessage() {
      const text = input.value.trim();
      if (!text || loading.value) return;

      const historyBeforeNewMessage = messages.value
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));

      error.value = '';
      input.value = '';

      // Reset textarea height
      nextTick(() => {
        if (inputField.value) inputField.value.style.height = 'auto';
      });

      // Add user message
      messages.value.push({
        role: 'user',
        content: text,
        time: Date.now()
      });
      scrollToBottom();

      loading.value = true;

      try {
        let url, body;

        if (mode.value === 'direct') {
          // Direct GPT chat with history
          url = `${API_BASE}/api/chat/direct`;
          body = {
            message: text,
            language: lang.value,
            history: historyBeforeNewMessage
          };
        } else {
          // Destination-aware chat with history and language support
          url = `${API_BASE}/api/chat`;
          body = {
            agentId: mode.value,
            message: text,
            language: lang.value,
            history: historyBeforeNewMessage
          };
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const error = new Error(errData.message || errData.error || `HTTP ${res.status}`);
          error.status = res.status;
          error.code = errData.code;
          throw error;
        }

        const data = await res.json();

        messages.value.push({
          role: 'assistant',
          content: data.output || (lang.value === 'ar' ? '\u0644\u0645 \u064A\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0631\u062F.' : 'No response received.'),
          time: Date.now()
        });
      } catch (err) {
        console.error('Chat error:', err);
        
        // Provide clearer error messages based on error type, code, or status
        let errorMessage = err.message;
        
        // Check for network/connectivity errors (TypeError from fetch failures)
        if (err instanceof TypeError || err.message?.includes('fetch') || err.message?.includes('ENOTFOUND')) {
          errorMessage = lang.value === 'ar'
            ? 'فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.'
            : 'Failed to connect to server. Please check your internet connection and try again.';
        } else if (err.code === 'NETWORK_ERROR') {
          errorMessage = lang.value === 'ar'
            ? 'لا يمكن الاتصال بخدمة الذكاء الاصطناعي. يرجى الاتصال بالمسؤول.'
            : 'Cannot connect to AI service. Please contact the administrator.';
        } else if (err.code === 'GPT_TIMEOUT') {
          errorMessage = lang.value === 'ar'
            ? 'انتهت مهلة طلب الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.'
            : 'AI service request timed out. Please try again.';
        } else if (err.code === 'MISSING_API_KEY' || err.status === 503) {
          errorMessage = lang.value === 'ar'
            ? 'خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى الاتصال بالمسؤول.'
            : 'AI service is not currently available. Please contact the administrator.';
        } else if (err.code === 'INVALID_API_KEY') {
          errorMessage = lang.value === 'ar'
            ? 'مفتاح خدمة الذكاء الاصطناعي غير صحيح. يرجى إبلاغ المسؤول.'
            : 'AI service credentials are invalid. Please notify the administrator.';
        } else if (err.status === 500) {
          errorMessage = lang.value === 'ar'
            ? 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.'
            : 'Server error occurred. Please try again later.';
        } else if (err.status === 429) {
          errorMessage = lang.value === 'ar'
            ? 'تم تجاوز الحد المسموح. يرجى المحاولة لاحقاً.'
            : 'Rate limit exceeded. Please try again later.';
        }
        
        error.value = lang.value === 'ar'
          ? `\u062D\u062F\u062B \u062E\u0637\u0623: ${errorMessage}`
          : `Error: ${errorMessage}`;
      } finally {
        loading.value = false;
        scrollToBottom();
        nextTick(() => inputField.value?.focus());
      }
    }

    // Close dropdown on outside click
    onMounted(() => {
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.relative')) {
          showModeMenu.value = false;
        }
      });

      // iOS keyboard handling: scroll input into view when focused
      if (inputField.value) {
        inputField.value.addEventListener('focus', () => {
          setTimeout(() => {
            inputField.value?.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }, 300);
        });
      }

      inputField.value?.focus();
    });

    return {
      messages,
      input,
      loading,
      error,
      lang,
      mode,
      showModeMenu,
      messagesContainer,
      inputField,
      quickActions,
      currentModeLabel,
      toggleLang,
      setMode,
      clearChat,
      formatTime,
      renderMarkdown,
      scrollToBottom,
      handleScroll,
      handleEnter,
      autoResize,
      sendQuickAction,
      sendMessage
    };
  }
}).mount('#app');
