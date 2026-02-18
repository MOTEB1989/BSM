// Pinia store for chat state management
import { defineStore } from 'pinia'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [],
    selectedAgent: 'direct',
    availableAgents: [],
    loading: false,
    error: null,
    language: 'ar'
  }),

  getters: {
    hasMessages: (state) => state.messages.length > 0,
    lastMessage: (state) => state.messages[state.messages.length - 1] || null
  },

  actions: {
    addMessage(role, content) {
      this.messages.push({
        id: Date.now(),
        role,
        content,
        timestamp: new Date().toISOString()
      })
    },

    clearMessages() {
      this.messages = []
      this.error = null
    },

    setAgent(agentId) {
      this.selectedAgent = agentId
    },

    setAgents(agents) {
      const safeAgents = Array.isArray(agents) ? agents : []
      this.availableAgents = safeAgents.filter((agent) => {
        if (!agent?.id || agent.id === 'direct') return false

        // Default-deny: require explicit expose.selectable=true
        return agent?.expose?.selectable === true
      })

      // Ensure selected agent remains valid
      const stillValid = this.selectedAgent === 'direct' || this.availableAgents.some((a) => a.id === this.selectedAgent)
      if (!stillValid) {
        this.selectedAgent = 'direct'
      }
    },

    setLoading(value) {
      this.loading = value
    },

    setError(error) {
      this.error = error
    },

    toggleLanguage() {
      this.language = this.language === 'ar' ? 'en' : 'ar'
    }
  }
})
