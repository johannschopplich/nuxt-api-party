export default defineNuxtConfig({
  modules: ['../src/module.ts'],

  apiParty: {
    endpoints: {
      testApi: {
        url: '/api',
      },
    },
  },

  experimental: {
    typescriptBundlerResolution: true,
  },

  typescript: {
    shim: false,
  },
})
