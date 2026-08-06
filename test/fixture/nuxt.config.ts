import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['../../src/module.ts'],

  apiParty: {
    endpoints: {
      testApi: {
        url: '/api',
      },
      forbidden: {
        url: '/api',
      },
      cookieApi: {
        url: '/api',
        cookies: true,
      },
    },
  },
})
