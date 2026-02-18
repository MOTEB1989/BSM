<template>
  <div class="flex flex-col items-center justify-center h-full text-center py-16 px-4">
    <div class="w-20 h-20 bg-lex-600/20 rounded-2xl flex items-center justify-center mb-6">
      <svg class="w-10 h-10 text-lex-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
      </svg>
    </div>
    
    <h2 class="text-2xl font-bold mb-2">
      {{ chatStore.language === 'ar' ? 'مرحبًا بك في LexBANK' : 'Welcome to LexBANK' }}
    </h2>
    
    <p class="text-gray-400 mb-8 max-w-md">
      {{ chatStore.language === 'ar' 
        ? 'المساعد الذكي جاهز لمساعدتك في الأسئلة القانونية والتقنية والإدارية' 
        : 'Smart assistant ready to help with legal, technical, and administrative questions' 
      }}
    </p>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
      <button
        v-for="action in quickActions"
        :key="action.text"
        @click="$emit('quickAction', action.text)"
        class="text-right p-4 bg-gray-900/50 hover:bg-gray-800/80 border border-gray-800 hover:border-lex-600/50 rounded-xl transition-all group"
      >
        <span class="text-lg mb-1 block">{{ action.icon }}</span>
        <span class="text-sm text-gray-300 group-hover:text-white transition-colors">
          {{ action.text }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useChatStore } from '~/stores/chat'

const chatStore = useChatStore()

const quickActions = computed(() => {
  if (chatStore.language === 'ar') {
    return [
      { icon: '⚖️', text: 'ما هي أنواع الشركات في السعودية؟' },
      { icon: '📄', text: 'ساعدني في صياغة عقد' },
      { icon: '🏢', text: 'ما هي متطلبات الحوكمة؟' },
      { icon: '💡', text: 'اشرح لي نظام الإفلاس' }
    ]
  }
  return [
    { icon: '⚖️', text: 'What are company types in Saudi Arabia?' },
    { icon: '📄', text: 'Help me draft a contract' },
    { icon: '🏢', text: 'What are governance requirements?' },
    { icon: '💡', text: 'Explain the bankruptcy system' }
  ]
})

defineEmits(['quickAction'])
</script>
