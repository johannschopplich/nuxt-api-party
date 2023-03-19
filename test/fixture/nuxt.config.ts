import { isCI } from 'std-env'

export default defineNuxtConfig({
  modules: ['../src/module.ts'],

  apiParty: {
    endpoints: {
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
