import { createError, defineEventHandler, readBody } from 'h3'
import type { FetchError } from 'ofetch'
import type { ModuleOptions } from '../module'
import { deserializeMaybeEncodedBody } from './utils'
import type { EndpointFetchOptions } from './utils'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event): Promise<any> => {
  const { apiParty } = useRuntimeConfig()
  const endpoints = (apiParty.endpoints as ModuleOptions['endpoints'])!
  const { endpointId } = event.context.params!

  if (!(endpointId in endpoints)) {
    throw createError({
      statusCode: 404,
      statusMessage: `Unknown API endpoint "${endpointId}"`,
    })
  }

  const { path, query, headers, body, ...fetchOptions } = await readBody<EndpointFetchOptions>(event)
  const endpoint = endpoints[endpointId]
  const _query = {
    ...endpoint.query,
    ...query,
  }

  try {
    return await $fetch(
      path!,
      {
        ...fetchOptions,
        baseURL: endpoint.url,
        query: Object.keys(_query).length ? _query : undefined,
        headers: {
          ...(endpoint.token && { Authorization: `Bearer ${endpoint.token}` }),
          ...endpoint.headers,
          ...headers,
        },
        ...(body && { body: deserializeMaybeEncodedBody(body) }),
      },
    )
  }
  catch (err) {
    throw createError((err as FetchError))
  }
})
