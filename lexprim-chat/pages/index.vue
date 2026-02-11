<template>
  <div class="flex flex-col min-h-screen bg-gray-950" :dir="chatStore.language === 'ar' ? 'rtl' : 'ltr'">
    <!-- Header -->
    <ChatHeader />

    <!-- Main Chat Area -->
    <main class="flex-1 overflow-hidden flex flex-col max-w-4xl w-full mx-auto">
      <!-- Messages Container -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-smooth scroll-custom"
      >
        <!-- Welcome Screen -->
        <ChatWelcome v-if="!chatStore.hasMessages" />

        <!-- Message Bubbles -->
        <ChatMessage
          v-for="message in chatStore.messages"
          :key="message.id"
          :message="message"
        />

        <!-- Loading Indicator -->
        <ChatLoading v-if="chatStore.loading" />

        <!-- Error Message -->
        <ChatError v-if="chatStore.error" :error="chatStore.error" @dismiss="chatStore.setError(null)" />
      </div>

      <!-- Input Area -->
      <ChatInput @send="handleSendMessage" />
    </main>
  </div>
</template>

<script setup>
import { useChatStore } from '~/stores/chat'
import { useApi } from '~/composables/useApi'

const chatStore = useChatStore()
const api = useApi()
const messagesContainer = ref(null)

// Load agents on mount
onMounted(async () => {
  try {
    const agents = await api.fetchAgents()
    chatStore.setAgents(agents)
  } catch (error) {
    console.error('Failed to load agents:', error)
  }
})

// Scroll to bottom when messages change
watch(() => chatStore.messages.length, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
})

// Handle sending message
const handleSendMessage = async (text) => {
  if (!text.trim() || chatStore.loading) return

  // Add user message
  chatStore.addMessage('user', text)
  chatStore.setError(null)
  chatStore.setLoading(true)

  try {
    // Get history (last 10 messages)
    const history = chatStore.messages.slice(-10)

    // Send message to API
    const response = await api.sendMessage(
      text,
      chatStore.selectedAgent,
      history
    )

    // Add assistant response
    const replyContent = response.output || response.response || 'لم يتم استلام رد'
    chatStore.addMessage('assistant', replyContent)
  } catch (error) {
    console.error('Send message error:', error)
    chatStore.setError(
      chatStore.language === 'ar'
        ? 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.'
        : 'Connection error. Please try again.'
    )
  } finally {
    chatStore.setLoading(false)
  }
}
</script>
