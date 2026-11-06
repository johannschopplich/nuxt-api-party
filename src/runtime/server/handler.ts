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
import { withBase, withQuery } from 'ufo'
import { deserializeMaybeEncodedBody, isForwardableBodyHeader, mergeHeaders, omitUndefinedValues } from '../utils'
import { assertAllowedRoute, assertPathBelowBase, resolveRoutePath } from './path'

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

  const {
    path,
    query,
    headers,
    method,
    body,
  } = (await readBody<EndpointFetchOptions | null | undefined>(event)) ?? {}

  if (typeof path !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path must be a string',
    })
  }

  if (method != null && typeof method !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Method must be a string',
    })
  }

  assertPathBelowBase(path)

  let bodyHeaders: Headers
  try {
    bodyHeaders = new Headers(headers ?? undefined)
  }
  catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Headers are invalid',
    })
  }

  const baseURL = endpoint.url

  const requestQuery = { ...endpoint.query, ...query }
  // Mirrors how `ofetch` builds the URL; a request hook that rewrites it is not checked again.
  const routePath = resolveRoutePath(withQuery(withBase(path, baseURL), requestQuery), baseURL)
  assertAllowedRoute(endpoint.allowedRoutes, routePath, method ?? 'GET')

  const requestHeaders = Object.fromEntries(
    ALLOWED_REQUEST_HEADERS.map(header => [header, getRequestHeader(event, header)]),
  )

  try {
    const response = await globalThis.$fetch.raw<ArrayBuffer>(
      path,
      {
        method,
        baseURL,
        query: requestQuery,
        headers: mergeHeaders(
          omitUndefinedValues({
            ...requestHeaders,
            'X-Forwarded-For': getRequestIP(event, { xForwardedFor: true }),
            ...(endpoint.token && { Authorization: `Bearer ${endpoint.token}` }),
            ...(endpoint.forwardCredentials && { cookie: getRequestHeader(event, 'cookie') }),
          }),
          endpoint.headers,
          new Headers(
            [...bodyHeaders].filter(
              ([name]) => isForwardableBodyHeader(name),
            ),
          ),
        ),
        ...(body && { body: await deserializeMaybeEncodedBody(body) }),
        responseType: 'arrayBuffer',
        ignoreResponseError: true,
        async onRequest(ctx) {
          await nitro.hooks.callHook('api-party:request', ctx, event)
          // @ts-expect-error: Types will be generated on Nuxt prepare.
          await nitro.hooks.callHook(`api-party:request:${endpointId}`, ctx, event)
        },
        async onResponse(ctx) {
          // @ts-expect-error: Types will be generated on Nuxt prepare.
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
    console.error('[nuxt-api-party]', error)

    throw createError({
      statusCode: 502,
      statusMessage: 'Bad Gateway',
    })
  }
})
