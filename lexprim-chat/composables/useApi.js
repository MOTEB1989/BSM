// Composable for API communication
export const useApi = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  const normalizeAgents = (response) => {
    const rawAgents = Array.isArray(response)
      ? response
      : (Array.isArray(response?.agents) ? response.agents : [])

    return rawAgents
      .filter((agent) => agent?.id)
      .map((agent) => ({
        id: agent.id,
        name: agent.name || agent.id,
        expose: agent.expose || {},
        contexts: agent.contexts || {}
      }))
  }

  const fetchAgents = async () => {
    try {
      const response = await $fetch(`${apiBase}/agents?mode=mobile`)
      return normalizeAgents(response)
    } catch (modeError) {
      console.warn('Mobile agents endpoint fallback to /agents:', modeError)
      const fallbackResponse = await $fetch(`${apiBase}/agents`)
      return normalizeAgents(fallbackResponse)
    }
  }

  const sendMessage = async (message, agentId = 'direct', history = []) => {
    try {
      const endpoint = agentId === 'direct'
        ? `${apiBase}/chat/direct`
        : `${apiBase}/control/run`

      const payload = agentId === 'direct'
        ? {
            message,
            language: 'ar',
            history: history.map(m => ({
              role: m.role,
              content: m.content
            }))
          }
        : {
            agentId,
            input: message,
            context: {
              mobile: true,
              source: 'lexprim-chat',
              client: 'iphone-web'
            }
          }

      const response = await $fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload
      })

      return response
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  }

  return {
    fetchAgents,
    sendMessage
  }
}
