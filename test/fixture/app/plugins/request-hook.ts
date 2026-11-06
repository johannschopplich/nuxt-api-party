import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('api-party:request', ({ options }, endpointId) => {
    options.headers.set('x-request-hook', 'hook')
    options.headers.set('x-app-endpoint-id', endpointId)
  })

  nuxtApp.hook('api-party:response', ({ request, response }, endpointId) => {
    if (String(request).includes('echo-headers'))
      response._data['x-app-response-endpoint-id'] = endpointId
  })
})
