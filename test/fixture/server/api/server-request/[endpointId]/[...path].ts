import { defineEventHandler, getQuery, getRouterParam } from '#imports'
import * as serverClients from '#nuxt-api-party/server'

// Looked up by name, since the endpoints it calls exist only in the suites that configure them.
export default defineEventHandler(async (event) => {
  const client = serverClients[`$${getRouterParam(event, 'endpointId')}` as keyof typeof serverClients]
  const { authorization, path } = getQuery(event)
  return await client(typeof path === 'string' ? path : getRouterParam(event, 'path')!, {
    headers: typeof authorization === 'string' ? { Authorization: authorization } : undefined,
  })
})
