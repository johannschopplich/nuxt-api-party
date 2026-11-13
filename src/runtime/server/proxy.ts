import type { H3Event } from 'h3'
import {
  createError,
  defineEventHandler,
  getRequestHeader,
  getRequestHeaders,
  getRequestIP,
  getRequestWebStream,
  getRouterParam,
  isError,
  send,
  setResponseHeader,
  setResponseStatus,
} from 'h3'
import { useNitroApp, useRuntimeConfig } from 'nitropack/runtime'
import { getQuery, joinURL, withQuery } from 'ufo'
import { getEndpointHeaders } from '../utils'
import { assertAllowedRoute, assertPathBelowBase, resolveRoutePath } from './path'
import { endOnAbort } from './stream'

/** Headers that describe a single connection rather than the message, so they end at the proxy. */
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'proxy-connection',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

const WITHHELD_REQUEST_HEADERS = new Set([
  ...HOP_BY_HOP_HEADERS,
  'host',
  // `fetch` negotiates its own encoding and decodes the response, and refuses to send `expect`.
  'accept-encoding',
  'expect',
])

const WITHHELD_RESPONSE_HEADERS = new Set([
  ...HOP_BY_HOP_HEADERS,
  // The body arrives decoded, so its original encoding and length no longer apply.
  'content-encoding',
  'content-length',
  'set-cookie',
])

const CREDENTIAL_HEADERS = new Set(['cookie', 'authorization'])

export default defineEventHandler(async (event) => {
  const nitro = useNitroApp()
  const endpointId = getRouterParam(event, 'endpointId')!
  const path = getRawPath(event)
  const { endpoints } = useRuntimeConfig().apiParty
  // An ID like `constructor` would otherwise find a member of the object prototype.
  const endpoint = Object.hasOwn(endpoints, endpointId)
    ? endpoints[endpointId]
    : undefined

  if (!endpoint) {
    throw createError({
      statusCode: 404,
      statusMessage: `Unknown endpoint "${endpointId}"`,
    })
  }

  // A cross-site page could otherwise send requests that carry the visitor's cookie on to the API.
  if (endpoint.forwardCredentials && getRequestHeader(event, 'sec-fetch-site') === 'cross-site') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cross-site requests are refused for endpoints that forward credentials',
    })
  }

  assertPathBelowBase(path)

  const url = withQuery(joinURL(endpoint.url, path), {
    ...endpoint.query,
    ...getQuery(event.node.req.url!),
  })
  // A request hook that rewrites the URL is not checked again.
  assertAllowedRoute(endpoint.allowedRoutes, resolveRoutePath(url, endpoint.url), event.method)

  // RFC 9110 makes every header the `Connection` header names hop-by-hop as well.
  const connectionHeaderNames = new Set(
    getRequestHeader(event, 'connection')?.split(',').map(name => name.trim().toLowerCase()),
  )

  const headers: Record<string, string> = {}
  for (const [name, value] of Object.entries(getRequestHeaders(event))) {
    if (value != null && !connectionHeaderNames.has(name.toLowerCase()) && isForwardableRequestHeader(name, endpoint.forwardCredentials))
      headers[name] = value
  }

  const clientAddress = getRequestIP(event, { xForwardedFor: true })
  if (clientAddress)
    headers['x-forwarded-for'] = clientAddress

  Object.assign(headers, getEndpointHeaders(endpoint))

  // A request from inside the app has no socket, and its response stream is handed back unread.
  const abortController = new AbortController()
  if (event.node.res.socket)
    event.node.res.once('close', () => abortController.abort())

  let response
  try {
    response = await globalThis.$fetch.raw<ReadableStream<Uint8Array>>(url, {
      method: event.method,
      headers,
      body: getRequestWebStream(event),
      responseType: 'stream',
      // The client decides whether to follow a redirect.
      redirect: 'manual',
      ignoreResponseError: true,
      async onRequest(ctx) {
        await nitro.hooks.callHook('api-party:request', ctx, event, endpointId)

        // `$fetch` arms a `timeout` only for a request without a signal.
        if (!ctx.options.timeout)
          ctx.options.signal ??= abortController.signal
      },
      async onResponse(ctx) {
        await nitro.hooks.callHook('api-party:response', ctx, event, endpointId)
      },
    })
  }
  catch (error) {
    // The client is gone, so nobody is left to answer.
    if (abortController.signal.aborted)
      return null

    // A hook may answer with a status of its own, such as 401.
    if (isError(error))
      throw error

    console.error('[nuxt-api-party]', error)
    throw createError({
      statusCode: 502,
      statusMessage: 'Bad Gateway',
    })
  }

  // A response hook may have answered the request already.
  if (event.handled)
    return

  setResponseStatus(event, response.status, response.statusText)

  for (const [name, value] of response.headers) {
    if (!WITHHELD_RESPONSE_HEADERS.has(name))
      setResponseHeader(event, name, value)
  }

  const cookies = response.headers.getSetCookie()
  if (endpoint.forwardCredentials && cookies.length)
    setResponseHeader(event, 'set-cookie', cookies)

  if (!response._data)
    return send(event)

  return event.node.res.socket
    ? endOnAbort(response._data, abortController.signal)
    : response._data
})

/**
 * Reads the path below the endpoint ID as the client sent it, so the checks and the API see every
 * percent-encoding. The router's own parameter comes decoded and without a trailing slash.
 */
function getRawPath(event: H3Event) {
  // h3 leaves the undecoded request target here, less `app.baseURL`.
  const pathname = event.node.req.url!.split('?', 1)[0]!
  const endpointIdIndex = event.context.matchedRoute!.path.split('/').indexOf(':endpointId')

  return pathname.split('/').slice(endpointIdIndex + 1).join('/')
}

function isForwardableRequestHeader(name: string, forwardCredentials?: boolean) {
  const header = name.toLowerCase()

  if (CREDENTIAL_HEADERS.has(header))
    return Boolean(forwardCredentials)

  return !WITHHELD_REQUEST_HEADERS.has(header)
}
