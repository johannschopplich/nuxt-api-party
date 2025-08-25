import type { EndpointFetchOptions } from '../types'
import {
  createError,
  defineEventHandler,
  getRequestHeader,
  getRequestIP,
  getRouterParam,
  isError,
  readBody,
  send,
  setResponseHeader,
  setResponseStatus,
  splitCookiesString,
} from 'h3'
import { useNitroApp, useRuntimeConfig } from 'nitropack/runtime'
import { deserializeMaybeEncodedBody, mergeHeaders, omitUndefinedValues } from '../utils'

const ALLOWED_REQUEST_HEADERS = [
  'Origin',
  'Referer',
  'User-Agent',
]

export default defineEventHandler(async (event) => {
  const nitro = useNitroApp()
  const endpointId = getRouterParam(event, 'endpointId')!
  const apiParty = useRuntimeConfig().apiParty
  const endpoint = apiParty.endpoints[endpointId]

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
    method,
    body,
  } = _body

  // Check if the path is an absolute URL
  if (new URL(path, 'http://localhost').origin !== 'http://localhost') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Absolute URLs are not allowed',
    })
  }

  // Allows to overwrite the backend URL with a custom header
  // (e.g. `jsonPlaceholder` endpoint becomes `jsonPlaceholder-Endpoint-Url`)
  const baseURL = new Headers(headers).get(`${endpointId}-Endpoint-Url`) || endpoint.url

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

  const requestHeaders = Object.fromEntries(
    ALLOWED_REQUEST_HEADERS.map(header => [header, getRequestHeader(event, header)]),
  )

  try {
    const response = await globalThis.$fetch.raw<ArrayBuffer>(
      path,
      {
        method,
        baseURL,
        query: {
          ...endpoint.query,
          ...query,
        },
        headers: mergeHeaders(
          omitUndefinedValues({
            ...requestHeaders,
            'X-Forwarded-For': getRequestIP(event, { xForwardedFor: true }),
            ...(endpoint.token && { Authorization: `Bearer ${endpoint.token}` }),
            ...(endpoint.cookies && { cookie: getRequestHeader(event, 'cookie') }),
          }),
          endpoint.headers,
          headers,
        ),
        ...(body && { body: await deserializeMaybeEncodedBody(body) }),
        responseType: 'arrayBuffer',
        ignoreResponseError: true,
        async onRequest(ctx) {
          await nitro.hooks.callHook('api-party:request', ctx, event)
          // @ts-expect-error: Types will be generated on Nuxt prepare
          await nitro.hooks.callHook(`api-party:request:${endpointId}`, ctx, event)
        },
        async onResponse(ctx) {
          // @ts-expect-error: Types will be generated on Nuxt prepare
          await nitro.hooks.callHook(`api-party:response:${endpointId}`, ctx, event)
          await nitro.hooks.callHook('api-party:response', ctx, event)
        },
      },
    )

    setResponseStatus(event, response.status, response.statusText)

    const cookies: string[] = []

    for (const [key, value] of response.headers.entries()) {
      if (key === 'content-encoding')
        continue

      if (key === 'content-length')
        continue

      if (key === 'set-cookie') {
        cookies.push(...splitCookiesString(value))
        continue
      }

      setResponseHeader(event, key, value)
    }

    if (cookies.length > 0)
      setResponseHeader(event, 'set-cookie', cookies)

    return send(event, new Uint8Array(response._data ?? []))
  }
  catch (error) {
    if (isError(error)) {
      throw error
    }
    console.error(error)

    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
    })
  }
})
