// Composable for API communication
export const useApi = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  const fetchAgents = async () => {
    try {
      const response = await $fetch(`${apiBase}/agents`)
      return response
    } catch (error) {
      console.error('Failed to fetch agents:', error)
      throw error
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
              source: 'lexprim-chat'
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
