import type { H3Error, H3Event } from 'h3'
import { experimentalRewriteProxyRedirects } from '#nuxt-api-party.nitro-config'
import {
  createError,
  defineEventHandler,
  getQuery,
  getRequestHeader,
  getRequestURL,
  getRouterParam,
  isError,
  proxyRequest,
} from 'h3'
import { useNitroApp, useRuntimeConfig } from 'nitropack/runtime'
import { hasLeadingSlash, joinURL, parsePath, parseURL, withoutBase, withQuery } from 'ufo'

const REDIRECT_CODES = new Set([201, 301, 302, 303, 307, 308])

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
        redirect: experimentalRewriteProxyRedirects ? 'manual' : 'follow',
        onRequest: hookErrorPromise.wrap(async (ctx) => {
          await nitro.hooks.callHook('api-party:request', ctx, event)
          // @ts-expect-error: Types will be generated on Nuxt prepare
          await nitro.hooks.callHook(`api-party:request:${endpointId}`, ctx, event)
        }),
        onResponse: hookErrorPromise.wrap(async (ctx) => {
          // @ts-expect-error: Types will be generated on Nuxt prepare
          await nitro.hooks.callHook(`api-party:response:${endpointId}`, ctx, event)
          await nitro.hooks.callHook('api-party:response', ctx, event)

          if (ctx.response.redirected) {
            ctx.response.headers.set('x-redirected-to', ctx.response.url)
          }
        }),
      }).raw,
      onResponse: (event) => {
        if (!endpoint.cookies && event.node.res.hasHeader('set-cookie')) {
          event.node.res.removeHeader('set-cookie')
        }

        if (experimentalRewriteProxyRedirects) {
          const status = event.node.res.statusCode
          if (REDIRECT_CODES.has(status)) {
            rewriteProxyRedirects(event, { baseURL, path })
          }
        }
      },
    }),
  ])
})

/**
 * Rewrite redirects for proxied requests.
 *
 * This rewrites relative redirects to be relative to the proxied
 * endpoint path, and absolute redirects to be relative to the
 * proxied endpoint base URL. If a relative redirect would point
 * outside of the proxied endpoint path, an error is thrown.
 *
 * Cross-origin redirects are not rewritten.
 *
 * @param event The H3 event
 * @param opts
 * @param opts.baseURL The base URL of the proxied endpoint
 * @param opts.path The path of the proxied request
 */
function rewriteProxyRedirects(event: H3Event, { baseURL, path }: { baseURL: string, path: string }) {
  const location = event.node.res.getHeader('location') as string | undefined
  if (location) {
    const reqUrl = getRequestURL(event)
    const locUrl = parseURL(location)
    const baseUrl = parseURL(baseURL)
    baseUrl.protocol ||= reqUrl.protocol
    baseUrl.host ||= reqUrl.host

    let cleanRedirect
    if (locUrl.host === baseUrl.host && locUrl.protocol === baseUrl.protocol) {
      // same origin full URL
      cleanRedirect = cleanRedirectLocation(`${locUrl.pathname}${locUrl.search}${locUrl.hash}`, baseUrl.pathname)
    }
    else if (hasLeadingSlash(location)) {
      // rewrite absolute paths to be relative to the proxied endpoint path
      cleanRedirect = cleanRedirectLocation(location, baseUrl.pathname)
    }
    else {
      // relative path or cross-origin URL, leave as-is
      return
    }

    const routePrefix = reqUrl.pathname.slice(0, reqUrl.pathname.length - path.length)
    const newLocation = joinURL(routePrefix, cleanRedirect)
    event.node.res.setHeader('x-original-location', location)
    event.node.res.setHeader('location', newLocation)
  }
}

function cleanRedirectLocation(location: string, baseURL: string) {
  const newLocation = withoutBase(location, baseURL)
  if (newLocation === location) {
    throw createError({
      statusCode: 500,
      message: `Cannot rewrite redirect '${location}' as it is outside of the endpoint base URL.`,
    })
  }
  return newLocation
}

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
