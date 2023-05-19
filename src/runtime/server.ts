import { createError, defineEventHandler, getRouterParams, readBody } from 'h3'
import { snakeCase } from 'scule'
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

  // Pass on cookies to the backend if the endpoint is configured to do so
  const cookies = endpoint.cookies ? parseCookies(event) : undefined

  // Allow to overwrite the backend url with a custom header (e.g. jsonPlaceholder endpoint
  // becomes JSON_PLACEHOLDER_BACKEND_URL)
  const customBackendURLHeader = `${snakeCase(endpointId).toUpperCase()}_BACKEND_URL`
  const baseURL = new Headers(headers).get(customBackendURLHeader) || endpoint.url

  try {
    return await $fetch(
      path!,
      {
        ...fetchOptions,
        baseURL,
        query: {
          ...endpoint.query,
          ...query,
        },
        headers: {
          ...(endpoint.token && { Authorization: `Bearer ${endpoint.token}` }),
          cookie: getRequestHeader(event, 'cookie') as string,
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
