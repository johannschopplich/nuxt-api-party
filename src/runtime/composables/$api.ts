import type { H3Event$Fetch, NitroFetchOptions } from 'nitropack'
import type { NuxtApp } from '#app'
import type { FetchResponseData, MethodOption, ParamsOption, PathItem, RequestBodyOption } from '../openapi'
import { defu } from 'defu'
import { hash } from 'ohash'
import { joinURL } from 'ufo'
import { allowPayloadCache, proxyRoute } from '#build/module/nuxt-api-party.config'
import { useNuxtApp, useRequestFetch, useRuntimeConfig } from '#imports'
import { CACHE_KEY_PREFIX } from '../constants'
import { mergeFetchHooks } from '../hooks'
import { resolvePathParams } from '../openapi'
import { mergeHeaders } from '../utils'

// #region options
export interface SharedFetchOptions {
  /**
   * The browser cache behavior.
   *
   * @remarks
   * This option is forwarded to the `fetch` API as the `cache` option.
   *
   * @default 'default'
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Request/cache
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching
   */
  cache?: RequestInit['cache']
  /**
   * Serve a repeated request from the Nuxt payload instead of sending it again.
   *
   * @remarks
   * A response fetched during SSR is always handed to the client through the payload. This option decides whether
   * the client keeps caching on its own afterwards. Requires the module option of the same name.
   *
   * @default false
   */
  payloadCache?: boolean
  /**
   * Cache key, generated from the request options by default.
   */
  key?: string
  /**
   * A custom `$fetch` function to use.
   *
   * @remarks
   * Implementers supporting server-side should wrap `useRequestFetch()` for a request through the server proxy,
   * and keep a direct request off it, so the visitor's headers stay with the app.
   *
   * @default `useRequestFetch()` through the server proxy, `globalThis.$fetch` for a direct request
   * @example
   * ```ts
   * async (request, options) => {
   *   return await useRequestFetch()(request, options)
   * }
   * ```
   */
  $fetch?: H3Event$Fetch
}

export type ApiClientFetchOptions
  = Omit<NitroFetchOptions<string>, 'body' | 'cache'>
    & {
      path?: Record<string, string>
      body?: string | Record<string, any> | FormData | null
    }

export type ApiClient = <T = unknown>(
  path: string,
  opts?: ApiClientFetchOptions & SharedFetchOptions,
) => Promise<T>
// #endregion options

export type OpenAPIRequestOptions<
  Method,
  LowercasedMethod,
  Params,
  Operation = 'get' extends LowercasedMethod ? ('get' extends keyof Params ? Params['get'] : never) : LowercasedMethod extends keyof Params ? Params[LowercasedMethod] : never,
> = MethodOption<Method, Params>
  & ParamsOption<Operation>
  & RequestBodyOption<Operation>
  & Omit<NitroFetchOptions<string>, 'query' | 'body' | 'method' | 'cache'>

export type OpenAPIClientFetchOptions<
  Method,
  LowercasedMethod,
  Params,
> = OpenAPIRequestOptions<Method, LowercasedMethod, Params>
  & SharedFetchOptions

export type OpenAPIClient<Paths, ClientOnlyOptions = SharedFetchOptions> = <
  ReqT extends Extract<keyof Paths, string>,
  Methods extends PathItem<Paths[ReqT]>,
  Method extends Extract<keyof Methods, string> | Uppercase<Extract<keyof Methods, string>>,
  LowercasedMethod extends Lowercase<Method> extends keyof Methods ? Lowercase<Method> : never,
  DefaultMethod extends 'get' extends LowercasedMethod ? 'get' : LowercasedMethod,
  ResT = Methods[DefaultMethod] extends Record<PropertyKey, any> ? FetchResponseData<Methods[DefaultMethod]> : never,
>(
  path: ReqT,
  options?: OpenAPIRequestOptions<Method, LowercasedMethod, Methods> & ClientOnlyOptions,
) => Promise<ResT>

declare module '#app' {
  interface NuxtApp {
    _pendingRequests?: Map<string, Promise<any>>
  }
}

export async function _$api<T = unknown>(
  endpointId: string,
  path: string,
  opts: ApiClientFetchOptions & SharedFetchOptions = {},
) {
  const nuxt = useNuxtApp()
  const runtimeConfig = useRuntimeConfig()
  const requestFetch = useRequestFetch()

  const {
    path: pathParams,
    query,
    headers,
    method,
    body,
    key,
    cache,
    payloadCache = false,
    $fetch: customFetch,
    ...fetchOptions
  } = defu(
    opts,
    nuxt.$apiParty?.endpoints?.[endpointId]?.defaults,
    nuxt.$apiParty?.defaults,
  )

  if (import.meta.dev && !allowPayloadCache && payloadCache) {
    console.error('[nuxt-api-party] Payload caching is disabled. Set `payloadCache: true` in the module options to enable it.')
  }

  // The payload always carries an SSR response over to the client, so a write is due there regardless of the option.
  const cachesPayload = allowPayloadCache && (import.meta.server || payloadCache)

  let _key: string | undefined
  const getCacheKey = () => {
    if (_key)
      return _key

    _key = key || (CACHE_KEY_PREFIX + hash([
      endpointId,
      path,
      pathParams,
      query,
      method,
      ...(body instanceof FormData ? [] : [body]),
    ]))

    return _key
  }

  // Only a client endpoint is published.
  const clientEndpoint = runtimeConfig.public.apiParty.endpoints[endpointId]

  if (allowPayloadCache && (nuxt.isHydrating || payloadCache)) {
    const cacheKey = getCacheKey()
    if (nuxt.payload.data[cacheKey]) {
      return nuxt.payload.data[cacheKey]
    }

    if (payloadCache) {
      const result = getPromiseMap(nuxt).get(cacheKey)
      if (result) {
        return result
      }
    }
  }

  const fetchHooks = mergeFetchHooks(fetchOptions, {
    async onRequest(ctx) {
      await nuxt.callHook('api-party:request', ctx, endpointId)
    },
    async onResponse(ctx) {
      await nuxt.callHook('api-party:response', ctx, endpointId)
    },
  })

  // `useRequestFetch` forwards the visitor's headers, cookie included, which only the server proxy may see.
  const $fetch = customFetch ?? (clientEndpoint ? globalThis.$fetch : requestFetch)

  // Headers travel as a plain object: during SSR, `useRequestFetch` spreads them into one, which empties a `Headers` instance.
  const targetOptions = clientEndpoint
    ? {
        baseURL: clientEndpoint.url,
        query: { ...clientEndpoint.query, ...query },
        headers: Object.fromEntries(mergeHeaders(
          clientEndpoint.token ? { Authorization: `Bearer ${clientEndpoint.token}` } : undefined,
          clientEndpoint.headers,
          headers,
        )),
      }
    : {
        // A `baseURL` of its own replaces the `app.baseURL` that `$fetch` would prepend.
        baseURL: joinURL(runtimeConfig.app.baseURL, proxyRoute, endpointId),
        query,
        headers: {
          ...Object.fromEntries(mergeHeaders(headers)),
          // During SSR, `useRequestFetch` forwards the `Sec-Fetch-Site` of the visitor's navigation, which would
          // trip the server proxy's cross-site check, but this request comes from the app itself.
          ...(import.meta.server && { 'sec-fetch-site': 'same-origin' }),
        },
      }

  const request = ($fetch<T>(resolvePathParams(path, pathParams), {
    ...fetchOptions,
    ...fetchHooks,
    ...targetOptions,
    cache,
    method,
    body,
  }) as Promise<T>)
    .then((response) => {
      if (cachesPayload) {
        const cacheKey = getCacheKey()
        nuxt.payload.data[cacheKey] = response
        getPromiseMap(nuxt).delete(cacheKey)
      }
      return response
    })
    // Invalidate cache if request fails.
    .catch((error) => {
      if (cachesPayload) {
        const cacheKey = getCacheKey()
        nuxt.payload.data[cacheKey] = undefined
        getPromiseMap(nuxt).delete(cacheKey)
      }
      throw error
    }) as Promise<T>

  if (cachesPayload) {
    getPromiseMap(nuxt).set(getCacheKey(), request)
  }

  return request
}

function getPromiseMap(nuxt: NuxtApp) {
  return (nuxt._pendingRequests ||= new Map()) as Map<string, Promise<any>>
}
