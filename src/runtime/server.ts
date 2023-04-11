import { createError, defineEventHandler, getRouterParams, readBody } from 'h3'
import destr from 'destr'
import type { FetchError } from 'ofetch'
import type { ModuleOptions } from '../module'
import { deserializeMaybeEncodedBody } from './utils'
import type { EndpointFetchOptions } from './utils'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event): Promise<any> => {
  const { endpointId } = getRouterParams(event)
  const { apiParty } = useRuntimeConfig()
  const endpoints = (apiParty as ModuleOptions).endpoints!
  const endpoint = endpoints[endpointId]

  if (!endpoint) {
    throw createError({
      statusCode: 404,
      statusMessage: `Unknown API endpoint "${endpointId}"`,
    })
  }

  let _body = await readBody<EndpointFetchOptions>(event)

  // Inconsistent `readBody` behavior in some Nitro presets
  // https://github.com/unjs/nitro/issues/912
  if (Buffer.isBuffer(_body))
    _body = destr((_body as Buffer).toString())

  const {
    path,
    query,
    headers,
    body,
    ...fetchOptions
  } = _body

  try {
    return await $fetch(
      path!,
      {
        ...fetchOptions,
        baseURL: endpoint.url,
        query: {
          ...endpoint.query,
          ...query,
        },
        headers: {
          ...(endpoint.token && { Authorization: `Bearer ${endpoint.token}` }),
          ...endpoint.headers,
          ...headers,
        },
        ...(body && { body: await deserializeMaybeEncodedBody(body) }),
      },
    )
  }
  catch (err) {
    throw createError((err as FetchError))
  }
})
