import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hooks.hook('api-party:request:jsonPlaceholder', async ({ request }) => {
    const url = typeof request === 'string' ? request : request.url
    console.log('[nuxt-api-party] [Nuxt] jsonPlaceholder request', url)
  })
})
