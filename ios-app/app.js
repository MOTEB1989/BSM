// CoreHub Nexus iOS App - Chat + Remote Control
const { createApp } = Vue;

const MODE_OPTIONS = [
  { id: "agent-auto", ar: "توجيه ذكي", en: "Smart Router" },
  { id: "direct", ar: "مباشر", en: "Direct GPT" },
  { id: "legal-agent", ar: "قانوني", en: "Legal Agent" },
  { id: "governance-agent", ar: "حوكمة", en: "Governance Agent" },
  { id: "code-review-agent", ar: "مراجعة كود", en: "Code Review" }
];

const QUICK_ACTIONS_AR = [
  { icon: "💬", text: "مساعدة عامة" },
  { icon: "⚖️", text: "استشارة قانونية" },
  { icon: "📊", text: "تحليل بيانات" },
  { icon: "🔐", text: "أمان ومطابقة" }
];

const QUICK_ACTIONS_EN = [
  { icon: "💬", text: "General Help" },
  { icon: "⚖️", text: "Legal Consultation" },
  { icon: "📊", text: "Data Analysis" },
  { icon: "🔐", text: "Security & Compliance" }
];

const API_PATHS = {
  status: "/api/status",
  health: "/api/health",
  healthDetailed: "/api/health/detailed",
  keyStatus: "/api/chat/key-status",
  mobileAgents: "/api/agents?mode=mobile",
  mcpTools: "/api/mcp/tools",
  mcpConnectionStatus: "/api/mcp/connection-status",
  mcpCall: "/api/mcp/tools/call",
  orchestratorRun: "/api/orchestrator/run"
};

createApp({
  data() {
    return {
      lang: "ar",
      activeView: "chat",
      mode: "agent-auto",
      input: "",
      messages: [],
      loading: false,
      error: "",
      isOnline: navigator.onLine,
      apiBaseUrl: window.location.origin || "https://sr-bsm.onrender.com",
      dashboard: {
        loading: false,
        lastSync: null,
        status: null,
        health: null,
        keyStatus: null,
        mobileAgents: [],
        mcpTools: [],
        connectionStatus: null
      },
      remoteLogs: [],
      mcpForm: {
        query: "",
        language: "ar",
        category: "general",
        agent: "gemini"
      }
    };
  },

  computed: {
    currentModeLabel() {
      const found = MODE_OPTIONS.find((item) => item.id === this.mode);
      if (!found) return this.mode;
      return this.lang === "ar" ? found.ar : found.en;
    },

    modeOptions() {
      return MODE_OPTIONS.map((item) => ({
        ...item,
        label: this.lang === "ar" ? item.ar : item.en
      }));
    },

    quickActions() {
      return this.lang === "ar" ? QUICK_ACTIONS_AR : QUICK_ACTIONS_EN;
    },

    mobileAgentCount() {
      return Array.isArray(this.dashboard.mobileAgents) ? this.dashboard.mobileAgents.length : 0;
    },

    cursorConnectionReady() {
      return this.dashboard.connectionStatus?.status === "ready";
    }
  },

  mounted() {
    this.loadFromStorage();
    this.setupOnlineListener();
    this.focusInput();

    const apiMetaTag = document.querySelector('meta[name="api-base-url"]');
    if (apiMetaTag) {
      this.apiBaseUrl = apiMetaTag.getAttribute("content");
    }

    if (this.activeView === "remote") {
      this.refreshDashboard();
    }
  },

  methods: {
    t(ar, en) {
      return this.lang === "ar" ? ar : en;
    },

    toggleLang() {
      this.lang = this.lang === "ar" ? "en" : "ar";
      this.mcpForm.language = this.lang;
      this.saveToStorage();
    },

    setView(view) {
      if (this.activeView === view) return;
      this.activeView = view;
      this.saveToStorage();
      if (view === "remote") {
        this.refreshDashboard();
      } else {
        this.focusInput();
      }
    },

    setMode(newMode) {
      this.mode = newMode;
      this.saveToStorage();
    },

    clearChat() {
      if (this.messages.length > 0) {
        const confirmed = confirm(this.t("هل تريد حذف جميع الرسائل؟", "Delete all messages?"));
        if (!confirmed) return;
      }
      this.messages = [];
      this.error = "";
      this.saveToStorage();
      this.focusInput();
    },

    async sendMessage() {
      if (!this.input.trim() || this.loading) return;

      const userMessage = this.input.trim();
      this.input = "";
      this.error = "";

      this.messages.push({
        role: "user",
        content: userMessage,
        time: Date.now()
      });
      this.saveToStorage();
      this.scrollToBottom();

      if (!this.isOnline) {
        this.error = this.t(
          "أنت غير متصل بالإنترنت. يرجى التحقق من الاتصال.",
          "You are offline. Please check your connection."
        );
        return;
      }

      this.loading = true;
      try {
        const response = await this.callAPI(userMessage);
        this.messages.push({
          role: "assistant",
          content: response,
          time: Date.now()
        });
        this.saveToStorage();
        this.scrollToBottom();
      } catch (err) {
        console.error("API error:", err);
        this.error = this.t(`حدث خطأ: ${err.message}`, `Error: ${err.message}`);
      } finally {
        this.loading = false;
        this.focusInput();
      }
    },

    async callAPI(message) {
      const history = this.messages.slice(-20).map((msg) => ({
        role: msg.role,
        content: msg.content
      }));

      const payload = {
        message,
        language: this.lang,
        history
      };

      let endpoint = `${this.apiBaseUrl}/api/chat/direct`;
      if (this.mode !== "direct") {
        endpoint = `${this.apiBaseUrl}/api/chat`;
        payload.agentId = this.mode;
      }

      const data = await this.requestJson(
        endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        },
        { timeoutMs: 30000 }
      );

      return data.output || data.message || data.response || this.t("لا يوجد رد", "No response");
    },

    async requestJson(url, options = {}, { timeoutMs = 15000 } = {}) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        let data = null;
        try {
          data = await response.json();
        } catch (_err) {
          data = null;
        }

        if (!response.ok) {
          const message = data?.error || data?.message || `${response.status} ${response.statusText}`;
          throw new Error(message);
        }

        return data || {};
      } catch (err) {
        if (err.name === "AbortError") {
          throw new Error(this.t("انتهت مهلة الاتصال. حاول مرة أخرى.", "Request timeout. Please retry."));
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
    },

    async refreshDashboard() {
      if (this.dashboard.loading) return;
      this.dashboard.loading = true;
      this.error = "";

      const requests = [
        ["status", `${this.apiBaseUrl}${API_PATHS.status}`],
        ["health", `${this.apiBaseUrl}${API_PATHS.health}`],
        ["keyStatus", `${this.apiBaseUrl}${API_PATHS.keyStatus}`],
        ["mobileAgents", `${this.apiBaseUrl}${API_PATHS.mobileAgents}`],
        ["mcpTools", `${this.apiBaseUrl}${API_PATHS.mcpTools}`],
        ["connectionStatus", `${this.apiBaseUrl}${API_PATHS.mcpConnectionStatus}`]
      ];

      const results = await Promise.allSettled(
        requests.map(([, url]) => this.requestJson(url))
      );

      results.forEach((result, index) => {
        const [key] = requests[index];
        if (result.status === "fulfilled") {
          if (key === "mobileAgents") {
            this.dashboard.mobileAgents = result.value.agents || [];
          } else if (key === "mcpTools") {
            this.dashboard.mcpTools = result.value.tools || [];
          } else {
            this.dashboard[key] = result.value;
          }
          return;
        }

        this.appendRemoteLog(
          `${this.t("فشل تحميل", "Failed loading")} ${key}`,
          result.reason?.message || "Unknown error",
          true
        );
      });

      this.dashboard.lastSync = Date.now();
      this.dashboard.loading = false;
    },

    async runRemoteAction(action) {
      try {
        if (action === "refresh") {
          await this.refreshDashboard();
          this.appendRemoteLog(this.t("تم تحديث اللوحة", "Dashboard refreshed"), { ok: true });
          return;
        }

        if (action === "healthDetailed") {
          const health = await this.requestJson(`${this.apiBaseUrl}${API_PATHS.healthDetailed}`);
          this.appendRemoteLog("health:detailed", health);
          return;
        }

        if (action === "listMobileAgents") {
          const agents = await this.requestJson(`${this.apiBaseUrl}${API_PATHS.mobileAgents}`);
          this.dashboard.mobileAgents = agents.agents || [];
          this.appendRemoteLog("agents?mode=mobile", { count: this.dashboard.mobileAgents.length });
          return;
        }

        if (action === "orchestratorRun") {
          const result = await this.requestJson(
            `${this.apiBaseUrl}${API_PATHS.orchestratorRun}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: "{}"
            },
            { timeoutMs: 30000 }
          );
          this.appendRemoteLog("orchestrator/run", result);
          return;
        }

        if (action === "cursorConnectionCheck") {
          const connectionStatus = await this.requestJson(`${this.apiBaseUrl}${API_PATHS.mcpConnectionStatus}`);
          this.dashboard.connectionStatus = connectionStatus;
          this.appendRemoteLog("mcp/connection-status", connectionStatus);
          return;
        }
      } catch (err) {
        const message = err.message || this.t("فشل تنفيذ العملية", "Action failed");
        this.error = this.t(`خطأ التحكم: ${message}`, `Remote control error: ${message}`);
        this.appendRemoteLog(this.t("خطأ تحكم", "Remote error"), message, true);
      }
    },

    async callMcpTool(name, toolArgs = {}) {
      const response = await this.requestJson(
        `${this.apiBaseUrl}${API_PATHS.mcpCall}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            arguments: toolArgs
          })
        },
        { timeoutMs: 30000 }
      );

      this.appendRemoteLog(`MCP: ${name}`, response.result || response);
      return response;
    },

    async runRouteBankingQuery() {
      const query = this.mcpForm.query.trim();
      if (!query) {
        this.error = this.t("أدخل استفسارًا أولاً.", "Enter a query first.");
        return;
      }

      try {
        const response = await this.callMcpTool("route_banking_query", {
          query,
          language: this.mcpForm.language,
          category: this.mcpForm.category
        });

        const text = response?.result?.content?.[0]?.text;
        if (text) {
          this.messages.push({
            role: "assistant",
            content: text,
            time: Date.now()
          });
          this.saveToStorage();
        }
      } catch (err) {
        this.error = this.t(`فشل أداة MCP: ${err.message}`, `MCP tool failed: ${err.message}`);
      }
    },

    async runCheckAgentStatus() {
      try {
        const response = await this.callMcpTool("check_agent_status", {
          agent: this.mcpForm.agent
        });

        const text = response?.result?.content?.[0]?.text;
        if (text) {
          this.appendRemoteLog(this.t("حالة العامل", "Agent status"), text);
        }
      } catch (err) {
        this.error = this.t(`فشل فحص العامل: ${err.message}`, `Agent status failed: ${err.message}`);
      }
    },

    appendRemoteLog(title, payload, isError = false) {
      const text = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
      this.remoteLogs.unshift({
        title,
        payload: text,
        time: Date.now(),
        isError
      });

      if (this.remoteLogs.length > 30) {
        this.remoteLogs = this.remoteLogs.slice(0, 30);
      }
    },

    connectionStateLabel() {
      const state = this.dashboard.connectionStatus?.status;
      if (state === "ready") return this.t("جاهز", "Ready");
      if (state === "partial") return this.t("جزئي", "Partial");
      if (state === "not_ready") return this.t("غير جاهز", "Not Ready");
      return "-";
    },

    connectionStateClass() {
      const state = this.dashboard.connectionStatus?.status;
      if (state === "ready") return "text-green-400";
      if (state === "partial") return "text-amber-400";
      if (state === "not_ready") return "text-red-400";
      return "text-gray-400";
    },

    sendQuickAction(text) {
      this.activeView = "chat";
      this.input = text;
      this.sendMessage();
    },

    handleKeyDown(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    },

    renderMarkdown(content) {
      if (!content) return "";
      try {
        marked.setOptions({
          breaks: true,
          gfm: true,
          headerIds: false,
          mangle: false
        });
        return marked.parse(content);
      } catch (err) {
        console.error("Markdown parse error:", err);
        return content;
      }
    },

    formatTime(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return this.lang === "ar" ? "الآن" : "now";
      if (diffMins < 60) return `${diffMins}${this.lang === "ar" ? "د" : "m"}`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}${this.lang === "ar" ? "س" : "h"}`;

      return date.toLocaleDateString(this.lang === "ar" ? "ar-SA" : "en-US", {
        month: "short",
        day: "numeric"
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

    focusInput() {
      this.$nextTick(() => {
        const input = this.$refs.inputField;
        if (input && this.activeView === "chat") {
          input.focus();
        }
      });
    },

    setupOnlineListener() {
      window.addEventListener("online", () => {
        this.isOnline = true;
      });
      window.addEventListener("offline", () => {
        this.isOnline = false;
      });
    },

    saveToStorage() {
      try {
        const state = {
          lang: this.lang,
          mode: this.mode,
          activeView: this.activeView,
          mcpForm: this.mcpForm,
          messages: this.messages.slice(-50)
        };
        localStorage.setItem("corehub-nexus-state", JSON.stringify(state));
      } catch (err) {
        console.error("Failed to save state:", err);
      }
    },

    loadFromStorage() {
      try {
        const saved = localStorage.getItem("corehub-nexus-state");
        if (!saved) return;

        const state = JSON.parse(saved);
        this.lang = state.lang || "ar";
        this.mode = state.mode || "agent-auto";
        this.activeView = state.activeView || "chat";
        this.messages = Array.isArray(state.messages) ? state.messages : [];
        this.mcpForm = {
          ...this.mcpForm,
          ...(state.mcpForm || {}),
          language: state.mcpForm?.language || this.lang
        };
      } catch (err) {
        console.error("Failed to load state:", err);
      }
    }
  }
}).mount("#app");
