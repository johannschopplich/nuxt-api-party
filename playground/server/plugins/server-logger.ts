import { defineNitroPlugin } from '#imports'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('api-party:request:jsonPlaceholder', async ({ request }) => {
    const url = typeof request === 'string' ? request : request.url
    console.log('[nuxt-api-party] [Nitro] jsonPlaceholder request', url)
  })
})
