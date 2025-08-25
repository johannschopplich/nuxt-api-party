import { defineNitroPlugin } from '#imports'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('api-party:request:jsonPlaceholder', async ({ request }) => {
    const url = typeof request === 'string' ? request : request.url
    console.log('[nuxt-api-party] [Nitro] jsonPlaceholder request', url)

    // if (Math.random() < 0.9) {
    //   console.warn('[nuxt-api-party] [Nitro] Simulating error for jsonPlaceholder request', url)
    //   throw createError({
    //     status: 403,
    //     statusMessage: 'Simulated error for jsonPlaceholder request',
    //   })
    // }
  })
})
