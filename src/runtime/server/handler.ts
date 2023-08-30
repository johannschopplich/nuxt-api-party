import { createError, defineEventHandler, getRequestHeader, getRouterParam, readBody } from 'h3'
import { deserializeMaybeEncodedBody } from '../utils'
import type { ModuleOptions } from '../../module'
import type { EndpointFetchOptions } from '../utils'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event): Promise<any> => {
  const endpointId = getRouterParam(event, 'endpointId')!
  const { apiParty } = useRuntimeConfig()
  const endpoints = (apiParty as unknown as ModuleOptions).endpoints || {}
  const endpoint = endpoints[endpointId]

  if (!endpoint) {
    throw createError({
      statusCode: 404,
      statusMessage: `Unknown API endpoint "${endpointId}"`,
    })
  }

  const _body = await readBody<EndpointFetchOptions>(event)

  const {
    path,
    query,
    headers,
    body,
    ...fetchOptions
  } = _body

  // Check if the path is an absolute URL
  if (new URL(path, 'http://localhost').origin !== 'http://localhost') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Absolute URLs are not allowed',
    })
  }

  // Allows to overwrite the backend url with a custom header
  // (e.g. `jsonPlaceholder` endpoint becomes `Json-Placeholder-Endpoint-Url`)
  const baseURL = new Headers(headers).get(`${endpointId}-endpoint-url`) || endpoint.url

  // Check if the base URL is in the allow list
  if (
    baseURL !== endpoint.url
    && !endpoint.allowedUrls?.includes(baseURL)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: `Base URL "${baseURL}" is not allowed`,
    })
  }

  try {
    const response = await globalThis.$fetch.raw<ArrayBuffer>(
      path,
      {
        ...fetchOptions,
        baseURL,
        query: {
          ...endpoint.query,
          ...query,
        },
        headers: {
          ...(endpoint.token && { Authorization: `Bearer ${endpoint.token}` }),
          ...(endpoint.cookies && { cookie: getRequestHeader(event, 'cookie') }),
          ...endpoint.headers,
          ...headers,
        },
        ...(body && { body: await deserializeMaybeEncodedBody(body) }),
        ignoreResponseError: true,
        responseType: 'arrayBuffer',
      },
    )
    setResponseStatus(event, response.status, response.statusText)
    setResponseHeaders(event, Object.fromEntries(response.headers.entries()))

    // ofetch has already decoded the response. Leaving this header can cause the
    // client issues when decoding and may create a conflict if a compression
    // middleware is used
    removeResponseHeader(event, 'content-encoding')

    await send(event, new Uint8Array(response._data ?? []))
  }
  catch (error) {
    console.error(error)

    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
    })
  }
})
