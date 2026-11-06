import { createError, defineNitroPlugin } from '#imports'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('api-party:request', (_ctx, _event, endpointId) => {
    if (endpointId === 'forbidden') {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }
  })
})
