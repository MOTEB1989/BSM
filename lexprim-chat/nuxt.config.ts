// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/ui'
  ],

  app: {
    head: {
      title: 'LexBANK - المساعد الذكي',
      htmlAttrs: {
        lang: 'ar',
        dir: 'rtl'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: 'واجهة المساعد الذكي من منصة LexBANK - دردشة GPT مهنية' },
        { name: 'theme-color', content: '#0ea5e9' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚖️</text></svg>" }
      ]
    }
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
      siteName: 'LexBANK',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://lexprim.com'
    }
  },

  css: [
    '~/assets/styles/main.scss'
  ],

  tailwindcss: {
    cssPath: '~/assets/styles/tailwind.css',
    configPath: 'tailwind.config.js'
  },

  // Mobile-first optimization
  experimental: {
    viewTransition: true
  },

  nitro: {
    compressPublicAssets: true
  }
})
