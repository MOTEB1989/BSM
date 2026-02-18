<template>
  <header class="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
    <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
      <!-- Logo and Title -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-lex-600 rounded-xl flex items-center justify-center text-lg font-bold shadow-lg shadow-lex-600/20">
          L
        </div>
        <div>
          <h1 class="text-lg font-bold text-white">LexBANK</h1>
          <p class="text-xs text-gray-400">
            {{ chatStore.language === 'ar' ? 'المساعد الذكي' : 'Smart Assistant' }}
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <!-- Language Toggle -->
        <button
          @click="chatStore.toggleLanguage"
          class="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
        >
          {{ chatStore.language === 'ar' ? 'EN' : 'عربي' }}
        </button>

        <!-- Agent Selector -->
        <div class="relative">
          <button
            @click="showAgentMenu = !showAgentMenu"
            class="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700 flex items-center gap-1"
          >
            <span>{{ currentAgentLabel }}</span>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          
          <!-- Dropdown Menu -->
          <div
            v-if="showAgentMenu"
            class="absolute left-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
          >
            <button
              @click="selectAgent('direct')"
              class="w-full text-right px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
              :class="{ 'bg-lex-600/20 text-lex-400': chatStore.selectedAgent === 'direct' }"
            >
              {{ chatStore.language === 'ar' ? 'دردشة مباشرة' : 'Direct Chat' }}
            </button>
            <button
              v-for="agent in chatStore.availableAgents"
              :key="agent.id"
              @click="selectAgent(agent.id)"
              class="w-full text-right px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
              :class="{ 'bg-lex-600/20 text-lex-400': chatStore.selectedAgent === agent.id }"
            >
              {{ agent.name || agent.id }}
            </button>
          </div>
        </div>

        <!-- New Chat -->
        <button
          @click="chatStore.clearMessages"
          class="px-3 py-1.5 text-xs bg-lex-600 hover:bg-lex-700 rounded-lg transition-colors shadow-sm"
        >
          {{ chatStore.language === 'ar' ? 'محادثة جديدة' : 'New Chat' }}
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useChatStore } from '~/stores/chat'

const chatStore = useChatStore()
const showAgentMenu = ref(false)

const currentAgentLabel = computed(() => {
  if (chatStore.selectedAgent === 'direct') {
    return chatStore.language === 'ar' ? 'دردشة مباشرة' : 'Direct Chat'
  }
  const agent = chatStore.availableAgents.find(a => a.id === chatStore.selectedAgent)
  return agent?.name || chatStore.selectedAgent
})

const selectAgent = (agentId) => {
  chatStore.setAgent(agentId)
  showAgentMenu.value = false
}

// Close dropdown on click outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) {
      showAgentMenu.value = false
    }
  })
})
</script>
