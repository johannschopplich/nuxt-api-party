export default defineNuxtConfig({
  modules: [
    'nuxt-api-party',
  ],
  apiParty: {
    server: {
      proxyMode: 'prefixed',
    },
    endpoints: {
      myApi: {
        url: '/api',
      },
    },
  },
})
