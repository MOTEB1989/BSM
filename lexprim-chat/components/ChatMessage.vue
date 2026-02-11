<template>
  <div 
    class="flex animate-slide-up"
    :class="message.role === 'user' ? 'justify-start' : 'justify-end'"
  >
    <div 
      class="max-w-[85%] sm:max-w-[75%]"
      :class="message.role === 'user' ? '' : ''"
    >
      <!-- Avatar + Name -->
      <div 
        class="flex items-center gap-2 mb-1"
        :class="message.role === 'user' ? '' : 'flex-row-reverse'"
      >
        <div 
          class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
          :class="message.role === 'user' ? 'bg-lex-600' : 'bg-emerald-600'"
        >
          {{ message.role === 'user' ? (chatStore.language === 'ar' ? 'أ' : 'U') : 'L' }}
        </div>
        <span class="text-xs text-gray-500">
          {{ message.role === 'user' ? (chatStore.language === 'ar' ? 'أنت' : 'You') : 'LexBANK' }}
        </span>
        <span class="text-xs text-gray-600">{{ formatTime(message.timestamp) }}</span>
      </div>
      
      <!-- Message Bubble -->
      <div 
        class="chat-bubble"
        :class="message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'"
      >
        <div v-if="message.role === 'assistant'" class="prose prose-invert prose-sm max-w-none" v-html="renderMarkdown(message.content)"></div>
        <div v-else class="whitespace-pre-wrap">{{ message.content }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useChatStore } from '~/stores/chat'
import { marked } from 'marked'

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
})

const chatStore = useChatStore()

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString(
    chatStore.language === 'ar' ? 'ar-SA' : 'en-US',
    { hour: '2-digit', minute: '2-digit' }
  )
}

const renderMarkdown = (text) => {
  if (!text) return ''
  try {
    return marked.parse(text, { breaks: true, gfm: true })
  } catch {
    return text
  }
}
</script>
