import type { H3Error } from 'h3'
import {
  createError,
  defineEventHandler,
  getProxyRequestHeaders,
  getQuery,
  getRouterParam,
  isError,
  readRawBody,
  sendProxy,
} from 'h3'
import { useNitroApp, useRuntimeConfig } from 'nitropack/runtime'
import { joinURL, withQuery } from 'ufo'
import { isForwardableProxyHeader } from '../utils'
import { assertAllowedRoute, assertPathBelowBase, resolveRoutePath } from './path'

const PAYLOAD_METHODS = new Set(['PATCH', 'POST', 'PUT', 'DELETE'])

export default defineEventHandler(async (event) => {
  const nitro = useNitroApp()
  const endpointId = getRouterParam(event, 'endpointId')!
  const path = getRouterParam(event, 'path') || ''
  const apiParty = useRuntimeConfig().apiParty
  const endpoints = apiParty.endpoints || {}
  const endpoint = endpoints[endpointId]

  if (!endpoint) {
    throw createError({
      statusCode: 404,
      statusMessage: `Unknown API endpoint "${endpointId}"`,
    })
  }

  assertPathBelowBase(path)

  const baseURL = endpoint.url

  const url = withQuery(joinURL(baseURL, path), getQuery(event))
  const routePath = resolveRoutePath(url, baseURL)
  assertAllowedRoute(endpoint.allowedRoutes, routePath, event.method)

  // `proxyRequest` forwards every incoming header, and its `headers` option can only add to that set, never drop one.
  const proxyHeaders: Record<string, string | undefined> = getProxyRequestHeaders(event)
  const headers = new Headers()
  for (const [name, value] of Object.entries(proxyHeaders)) {
    if (value != null && isForwardableProxyHeader(name, { cookies: endpoint.cookies }))
      headers.set(name, value)
  }

  const rawBody = PAYLOAD_METHODS.has(event.method)
    ? await readRawBody(event, false).catch(() => undefined)
    : undefined

  const hookErrorPromise = createHookErrorPromise()
  return await Promise.race([
    hookErrorPromise,
    sendProxy(event, url, {
      fetchOptions: {
        method: event.method,
        headers,
        // A view rather than a copy, since an upload can be large. Node never backs a buffer with shared memory.
        body: rawBody && new Uint8Array(rawBody.buffer as ArrayBuffer, rawBody.byteOffset, rawBody.byteLength),
      },
      fetch: globalThis.$fetch.create({
        onRequest: hookErrorPromise.wrap(async (ctx) => {
          await nitro.hooks.callHook('api-party:request', ctx, event)
          // @ts-expect-error: Types will be generated on Nuxt prepare.
          await nitro.hooks.callHook(`api-party:request:${endpointId}`, ctx, event)
        }),
        onResponse: hookErrorPromise.wrap(async (ctx) => {
          // @ts-expect-error: Types will be generated on Nuxt prepare.
          await nitro.hooks.callHook(`api-party:response:${endpointId}`, ctx, event)
          await nitro.hooks.callHook('api-party:response', ctx, event)
        }),
      }).raw,
      onResponse: (event) => {
        if (!endpoint.cookies && event.node.res.hasHeader('set-cookie')) {
          event.node.res.removeHeader('set-cookie')
        }
      },
    }),
  ])
})

interface HookErrorPromise extends Promise<never> {
  wrap: <P extends any[]>(fn: (...args: P) => Promise<void>) => (...args: P) => Promise<void>
}

/**
 * Creates a promise that rejects when a hook throws an H3 error. `sendProxy` turns every fetch
 * rejection into a 502, but a hook may want to answer with a status of its own, such as 403.
 */
function createHookErrorPromise(): HookErrorPromise {
  let reject: (reason?: H3Error) => void = () => void 0
  const hookErrorPromise = new Promise<never>((_, _reject) => {
    reject = _reject
  })

  return Object.assign(hookErrorPromise, {
    wrap: <P extends any[]>(fn: (...args: P) => Promise<void>) => {
      return async (...args: P) => {
        try {
          await fn(...args)
        }
        catch (error) {
          if (isError(error)) {
            reject(error)
          }
          // Rethrow so the fetch fails; an H3 error has already settled the race.
          throw error
        }
      }
    },
  })
}
