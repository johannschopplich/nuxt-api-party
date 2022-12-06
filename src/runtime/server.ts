import { createError, defineEventHandler, readBody } from 'h3'
import type { FetchError } from 'ofetch'
import type { ModuleOptions } from '../module'
import type { EndpointFetchOptions } from './utils'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event): Promise<any> => {
  const { apiParty } = useRuntimeConfig()
  const endpoints = (apiParty.endpoints as ModuleOptions['endpoints'])!
  const { endpointId } = event.context.params

  if (!(endpointId in endpoints)) {
    throw createError({
      statusCode: 404,
      statusMessage: `Unknown API endpoint "${endpointId}"`,
    })
  }

  const {
    request,
    query,
    headers,
    ...fetchOptions
  } = await readBody<EndpointFetchOptions>(event)
  const endpoint = endpoints[endpointId]

  const _query = {
    ...endpoint.query,
    ...query,
  }

  try {
    return await $fetch(
      request,
      {
        ...fetchOptions,
        baseURL: endpoint.url,
        query: Object.keys(_query).length ? _query : undefined,
        headers: {
          ...(endpoint.token && { Authorization: `Bearer ${endpoint.token}` }),
          ...endpoint.headers,
          ...headers,
        },
      },
    )
  }
  catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch from API endpoint "${endpointId}"`,
      data: (err as FetchError).message,
    })
  }
})
