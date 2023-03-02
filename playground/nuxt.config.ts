import { isCI } from 'std-env'

export default defineNuxtConfig({
  modules: ['../src/module.ts'],

  apiParty: {
    endpoints: {
      jsonPlaceholder: {
        url: process.env.JSON_PLACEHOLDER_BASE_URL!,
      },
      testApi: {
        url: '/api',
      },
    },
  },

  typescript: {
    typeCheck: !isCI,
    shim: false,
  },
})
