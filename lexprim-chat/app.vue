<template>
  <div class="min-h-screen flex flex-col">
    <NuxtPage />
  </div>
</template>

<script setup>
// App root component
useHead({
  titleTemplate: (title) => title ? `${title} | LexBANK` : 'LexBANK - المساعد الذكي'
})
</script>
