import { defineNitroPlugin, setResponseHeader } from '#imports'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('api-party:request', ({ options }, _event, endpointId) => {
    options.headers.set('x-nitro-endpoint-id', endpointId)
  })

  nitroApp.hooks.hook('api-party:response', (_ctx, event, endpointId) => {
    if (event)
      setResponseHeader(event, 'x-nitro-endpoint-id', endpointId)
  })
})
