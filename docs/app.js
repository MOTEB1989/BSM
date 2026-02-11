const { createApp, ref, computed, nextTick, onMounted } = Vue;

// Standalone version - API URL stored in localStorage
const STORAGE_KEY = 'lexbank_api_url';

createApp({
  setup() {
    const messages = ref([]);
    const input = ref('');
    const loading = ref(false);
    const error = ref('');
    const lang = ref('ar');
    const mode = ref('direct');
    const showModeMenu = ref(false);
    const showConfig = ref(false);
    const apiUrl = ref(localStorage.getItem(STORAGE_KEY) || '');
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
        direct: lang.value === 'ar' ? '\u062F\u0631\u062F\u0634\u0629 \u0645\u0628\u0627\u0634\u0631\u0629' : 'Direct Chat',
        'legal-agent': lang.value === 'ar' ? '\u0627\u0644\u0648\u0643\u064A\u0644 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064A' : 'Legal Agent',
        'governance-agent': lang.value === 'ar' ? '\u0648\u0643\u064A\u0644 \u0627\u0644\u062D\u0648\u0643\u0645\u0629' : 'Governance Agent'
      };
      return labels[mode.value] || labels.direct;
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

    function saveApiUrl() {
      const url = apiUrl.value.trim().replace(/\/+$/, '');
      apiUrl.value = url;
      localStorage.setItem(STORAGE_KEY, url);
      showConfig.value = false;
    }

    function formatTime(time) {
      if (!time) return '';
      const d = new Date(time);
      return d.toLocaleTimeString(lang.value === 'ar' ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    function renderMarkdown(text) {
      if (!text) return '';
      try {
        return marked.parse(text, { breaks: true, gfm: true });
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

    function handleEnter(e) {
      if (!e.shiftKey) {
        e.preventDefault();
        sendMessage();
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

      const base = apiUrl.value.trim().replace(/\/+$/, '');
      if (!base) {
        showConfig.value = true;
        error.value = lang.value === 'ar'
          ? '\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0631\u0627\u0628\u0637 \u0627\u0644\u0640 API \u0623\u0648\u0644\u0627\u064B'
          : 'Please enter the API URL first';
        return;
      }

      error.value = '';
      input.value = '';

      nextTick(() => {
        if (inputField.value) inputField.value.style.height = 'auto';
      });

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
          url = `${base}/api/chat/direct`;
          body = {
            message: text,
            language: lang.value,
            history: historyBeforeNewMessage
          };
        } else {
          url = `${base}/api/chat`;
          body = {
            agentId: mode.value,
            input: text
          };
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `HTTP ${res.status}`);
        }

        const data = await res.json();

        messages.value.push({
          role: 'assistant',
          content: data.output || (lang.value === 'ar' ? '\u0644\u0645 \u064A\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0631\u062F.' : 'No response received.'),
          time: Date.now()
        });
      } catch (err) {
        console.error('Chat error:', err);
        error.value = lang.value === 'ar'
          ? `\u062D\u062F\u062B \u062E\u0637\u0623: ${err.message}`
          : `Error: ${err.message}`;
      } finally {
        loading.value = false;
        scrollToBottom();
        nextTick(() => inputField.value?.focus());
      }
    }

    onMounted(() => {
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.relative')) {
          showModeMenu.value = false;
        }
      });

      // Show config if no API URL saved
      if (!apiUrl.value) {
        showConfig.value = true;
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
      showConfig,
      apiUrl,
      messagesContainer,
      inputField,
      quickActions,
      currentModeLabel,
      toggleLang,
      setMode,
      clearChat,
      saveApiUrl,
      formatTime,
      renderMarkdown,
      scrollToBottom,
      handleEnter,
      sendQuickAction,
      sendMessage
    };
  }
}).mount('#app');
