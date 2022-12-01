import { createError, defineEventHandler, readBody } from 'h3'
import { withQuery } from 'ufo'
import type { FetchError } from 'ofetch'
import type { QueryObject } from 'ufo'
import type { ModuleOptions } from '../../../module'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event): Promise<any> => {
  const { apiParty } = useRuntimeConfig()
  const eventBody = await readBody<{
    path: string
    query?: QueryObject
    method?: string
    body?: Record<string, any>
    headers: Record<string, string>
  }>(event)
  const { endpointId } = event.context.params
  const endpoints = (apiParty.endpoints as ModuleOptions['endpoints'])!

  if (!(endpointId in endpoints)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Unknown endpoint ID received',
    })
  }

  const { path, query, method, body, headers } = eventBody
  const endpoint = endpoints[endpointId]

  try {
    return await $fetch(withQuery(path, query ?? {}), {
      baseURL: endpoint.url,
      method,
      body,
      headers: {
        ...(endpoint.token && { Authorization: `Bearer ${endpoint.token}` }),
        ...endpoint.headers,
        ...headers,
      },
    })
  }
  catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Couldn\'t fetch API data',
      data: (err as FetchError).message,
    })
  }
})
