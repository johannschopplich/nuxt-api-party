import { createError, defineEventHandler, readBody } from 'h3'
import type { FetchError } from 'ofetch'
import type { ModuleOptions } from '../../../module'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event): Promise<any> => {
  const { apiParty } = useRuntimeConfig()
  const body = await readBody<{
    path: string
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

  const { path, headers } = body
  const endpoint = endpoints[endpointId]

  try {
    return await $fetch(path, {
      baseURL: endpoint.url,
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
