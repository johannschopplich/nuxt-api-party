import { isCI } from 'std-env'

export default defineNuxtConfig({
  modules: ['../src/module.ts'],

  apiParty: {
    endpoints: {
      'json-placeholder': {
        url: process.env.JSON_PLACEHOLDER_BASE_URL!,
      },
      'test-api': {
        url: '/api',
      },
    },
  },

  typescript: {
    // Enable again, once this is resolved:
    // https://github.com/fi3ework/vite-plugin-checker/pull/223
    // typeCheck: !isCI,
    shim: false,
  },
})
