<template>
  <div class="flex justify-center">
    <div class="bg-red-900/30 border border-red-800/50 rounded-xl px-4 py-3 text-red-300 text-sm flex items-center gap-2">
      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>{{ error }}</span>
      <button @click="$emit('dismiss')" class="text-red-400 hover:text-red-200 mr-2">&times;</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  error: {
    type: String,
    required: true
  }
})

defineEmits(['dismiss'])
</script>
