export default defineNuxtConfig({
  modules: ['../../src/module.ts'],

  apiParty: {
    endpoints: {
      testApi: {
        url: '/api',
      },
    },
  },

  typescript: {
    shim: false,
  },
})
