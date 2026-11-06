import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hooks.hook('api-party:request', async ({ request }, endpointId) => {
    const url = typeof request === 'string' ? request : request.url
    console.log(`[nuxt-api-party] [Nuxt] ${endpointId} request`, url)
  })
})
