import { defineEventHandler, getRouterParam } from '#imports'
import * as serverClients from '#nuxt-api-party/server'

// Looked up by name, since the endpoints it calls exist only in the suites that configure them.
export default defineEventHandler(async (event) => {
  const client = serverClients[`$${getRouterParam(event, 'endpointId')}` as keyof typeof serverClients]
  return await client(getRouterParam(event, 'path')!)
})
