import { defineNitroPlugin, getRequestHeader } from '#imports'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('api-party:request', ({ options }, event) => {
    const timeout = event && getRequestHeader(event, 'x-hook-timeout')
    if (timeout)
      options.timeout = Number(timeout)
  })
})
