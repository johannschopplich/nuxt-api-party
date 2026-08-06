import type { H3Error } from 'h3'
import {
  createError,
  defineEventHandler,
  getProxyRequestHeaders,
  getQuery,
  getRequestHeader,
  getRouterParam,
  isError,
  readRawBody,
  sendProxy,
} from 'h3'
import { useNitroApp, useRuntimeConfig } from 'nitropack/runtime'
import { joinURL, withQuery } from 'ufo'
import { isForwardableProxyHeader } from '../utils'

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

  // Check if the path is an absolute URL.
  if (new URL(path, 'http://localhost').origin !== 'http://localhost') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Absolute URLs are not allowed',
    })
  }
  const baseURL = getRequestHeader(event, `${endpointId}-Endpoint-Url`) || endpoint.url

  if (
    baseURL !== endpoint.url
    && !endpoint.allowedUrls?.includes(baseURL)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: `Base URL "${baseURL}" is not allowed`,
    })
  }

  // `proxyRequest` forwards every incoming header, and its `headers` option can only add to that set, never drop one.
  const proxyHeaders: Record<string, string | undefined> = getProxyRequestHeaders(event)
  const headers = new Headers()
  for (const [name, value] of Object.entries(proxyHeaders)) {
    if (value != null && isForwardableProxyHeader(name, { endpointId, cookies: endpoint.cookies }))
      headers.set(name, value)
  }

  const rawBody = PAYLOAD_METHODS.has(event.method)
    ? await readRawBody(event, false).catch(() => undefined)
    : undefined

  const hookErrorPromise = createHookErrorPromise()
  const url = withQuery(joinURL(baseURL, path), getQuery(event))
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
 * Creates a promise that rejects when a hook throws an H3 error, a hack to bypass `sendProxy`'s error handling.
 *
 * `sendProxy` turns every fetch rejection into a 502, but a hook may want to answer
 * with a status of its own, such as 403.
 *
 * When combined with `Promise.race`, this allows us to handle errors
 * in hooks without triggering the default error handling of H3.
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
          throw error // Rethrow to preserve the original error stack.
        }
      }
    },
  })
}
