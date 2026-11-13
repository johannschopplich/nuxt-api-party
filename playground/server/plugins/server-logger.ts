import { defineNitroPlugin } from '#imports'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('api-party:request', async ({ request }, _event, endpointId) => {
    const url = typeof request === 'string'
      ? request
      : request.url
    console.log(`[nuxt-api-party] [Nitro] ${endpointId} request`, url)
  })
})
