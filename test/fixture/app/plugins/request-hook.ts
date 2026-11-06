import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('api-party:request', ({ options }) => {
    options.headers.set('x-request-hook', 'hook')
  })
})
