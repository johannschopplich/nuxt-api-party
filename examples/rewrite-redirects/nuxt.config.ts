export default defineNuxtConfig({
  modules: [
    'nuxt-api-party',
  ],
  apiParty: {
    server: {
      proxyMode: 'passthrough',
    },
    endpoints: {
      myApi: {
        url: '/api',
      },
    },
  },
})
