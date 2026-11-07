import { defineNitroPlugin } from '#imports'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('api-party:request', ({ options }, event) => {
    if (event?.context.pageTag)
      options.headers.set('x-page-tag', event.context.pageTag)
  })
})
