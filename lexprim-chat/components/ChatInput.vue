<template>
  <div class="border-t border-gray-800 bg-gray-900/50 backdrop-blur-md p-4">
    <div class="max-w-4xl mx-auto">
      <div class="flex gap-3 items-end">
        <!-- Text Input -->
        <div class="flex-1 relative">
          <textarea
            ref="inputField"
            v-model="input"
            @keydown.enter.exact="handleEnter"
            :placeholder="chatStore.language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message...'"
            :disabled="chatStore.loading"
            rows="1"
            class="w-full bg-gray-800 border border-gray-700 focus:border-lex-500 focus:ring-1 focus:ring-lex-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none transition-all outline-none text-sm leading-relaxed max-h-32 overflow-y-auto"
            :dir="chatStore.language === 'ar' ? 'rtl' : 'ltr'"
          ></textarea>
        </div>
        
        <!-- Send Button -->
        <button
          @click="sendMessage"
          :disabled="chatStore.loading || !input.trim()"
          class="h-11 w-11 flex-shrink-0 bg-lex-600 hover:bg-lex-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all shadow-lg shadow-lex-600/20 disabled:shadow-none"
        >
          <svg v-if="!chatStore.loading" class="w-5 h-5 text-white rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
          <svg v-else class="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </button>
      </div>
      
      <!-- Footer Info -->
      <p class="text-xs text-gray-600 mt-2 text-center">
        {{ chatStore.language === 'ar' 
          ? 'LexBANK مدعوم بتقنية GPT | جميع المحادثات سرية' 
          : 'LexBANK powered by GPT | All conversations are confidential' 
        }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { useChatStore } from '~/stores/chat'

const chatStore = useChatStore()
const input = ref('')
const inputField = ref(null)

const emit = defineEmits(['send'])

const sendMessage = () => {
  const text = input.value.trim()
  if (!text || chatStore.loading) return

  emit('send', text)
  input.value = ''

  // Reset textarea height
  nextTick(() => {
    if (inputField.value) {
      inputField.value.style.height = 'auto'
    }
  })
}

const handleEnter = (e) => {
  if (!e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// Focus input on mount
onMounted(() => {
  inputField.value?.focus()
})
</script>
