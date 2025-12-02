export default defineNuxtConfig({
  modules: [
    'nuxt-api-party',
  ],
  apiParty: {
    experimental: {
      enablePrefixedProxy: true,
    },
    endpoints: {
      myApi: {
        url: '/api',
      },
    },
  },
})
