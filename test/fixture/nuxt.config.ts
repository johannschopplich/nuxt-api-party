export default defineNuxtConfig({
  modules: ['../src/module.ts'],

  apiParty: {
    endpoints: {
      testApi: {
        url: '/api',
      },
    },
  },

  future: {
    typescriptBundlerResolution: true,
  },

  typescript: {
    shim: false,
  },
})
