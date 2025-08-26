import type { H3Error } from 'h3'
import {
  createError,
  defineEventHandler,
  getQuery,
  getRequestHeader,
  getRouterParam,
  isError,
  proxyRequest,
} from 'h3'
import { useNitroApp, useRuntimeConfig } from 'nitropack/runtime'
import { joinURL, withQuery } from 'ufo'

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

  // Check if the path is an absolute URL
  if (new URL(path, 'http://localhost').origin !== 'http://localhost') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Absolute URLs are not allowed',
    })
  }
  const baseURL = getRequestHeader(event, `${endpointId}-Endpoint-Url`) || endpoint.url

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

  if (!endpoint.cookies) {
    delete event.node.req.headers.cookies
  }

  const hookErrorPromise = createHookErrorPromise()
  const url = withQuery(joinURL(baseURL, path), getQuery(event))
  return await Promise.race([
    hookErrorPromise,
    proxyRequest(event, url, {
      fetch: globalThis.$fetch.create({
        onRequest: hookErrorPromise.wrap(async (ctx) => {
          await nitro.hooks.callHook('api-party:request', ctx, event)
          // @ts-expect-error: Types will be generated on Nuxt prepare
          await nitro.hooks.callHook(`api-party:request:${endpointId}`, ctx, event)
        }),
        onResponse: hookErrorPromise.wrap(async (ctx) => {
          // @ts-expect-error: Types will be generated on Nuxt prepare
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
 * This is a hack to bypass proxyRequest's server error handling.
 *
 * H3 is configured to treat all errors in fetch as 503 errors, but hooks
 * allow additional error handling, such as 403 errors.
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
          throw error // Rethrow to preserve the original error stack
        }
      }
    },
  })
}
