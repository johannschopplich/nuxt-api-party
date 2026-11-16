import { defineNitroPlugin, getRequestHost } from '#imports'

// The proxy withholds `Host` from the API, so the host the proxy itself sees travels in a header of its own.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('api-party:request', ({ options }, event) => {
    if (event)
      options.headers.set('x-proxy-host', getRequestHost(event))
  })
})
