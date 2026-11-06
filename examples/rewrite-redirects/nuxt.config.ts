export default defineNuxtConfig({
  modules: [
    'nuxt-api-party',
  ],
  apiParty: {
    endpoints: {
      myApi: {
        url: '/api',
      },
    },
  },
})
