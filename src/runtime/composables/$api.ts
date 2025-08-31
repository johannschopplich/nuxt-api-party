import type { NuxtApp } from '#app'
import type { NitroFetchOptions } from 'nitropack'
import type { FetchResponseData, FilterMethods, MethodOption, ParamsOption, RequestBodyOption } from '../openapi'
import { allowClient, experimentalDisableClientPayloadCache, experimentalEnablePrefixedProxy, serverBasePath } from '#build/module/nuxt-api-party.config'
import { useNuxtApp, useRequestFetch, useRequestHeaders, useRuntimeConfig } from '#imports'
import { consola } from 'consola'
import { hash } from 'ohash'
import { joinURL } from 'ufo'
import { CACHE_KEY_PREFIX } from '../constants'
import { isFormData } from '../form-data'
import { mergeFetchHooks } from '../hooks'
import { resolvePathParams } from '../openapi'
import { mergeHeaders, serializeMaybeEncodedBody } from '../utils'

// #region options
export interface SharedFetchOptions {
  /**
   * Skip the Nuxt server proxy and fetch directly from the API.
   * Requires `client` set to `true` in the module options.
   * @remarks
   * If Nuxt SSR is disabled, client-side requests are enabled by default.
   * @default false
   */
  client?: boolean
  /**
   * The browser cache behavior.
   *
   * It accepts the same values as {@linkcode RequestInit.cache}. For backwards
   * compatibility, you can also use `true` or `false` to control payload caching.
   *
   * @remarks
   * This option is forwarded to the `fetch` API as the `cache` option.
   *
   * @default 'default'
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Request/cache
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching
   */
  cache?: RequestInit['cache'] | boolean
  /**
   * By default, a cache key will be generated from the request options.
   * With this option, you can provide a custom cache key.
   * @default undefined
   */
  key?: string
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

export type OpenAPIClientFetchOptions<
  Method,
  LowercasedMethod,
  Params,
  Operation = 'get' extends LowercasedMethod ? ('get' extends keyof Params ? Params['get'] : never) : LowercasedMethod extends keyof Params ? Params[LowercasedMethod] : never,
> = MethodOption<Method, Params>
  & ParamsOption<Operation>
  & RequestBodyOption<Operation>
  & Omit<NitroFetchOptions<string>, 'query' | 'body' | 'method' | 'cache'>
  & SharedFetchOptions

export type OpenAPIClient<Paths> = <
  ReqT extends Extract<keyof Paths, string>,
  Methods extends FilterMethods<Paths[ReqT]>,
  Method extends Extract<keyof Methods, string> | Uppercase<Extract<keyof Methods, string>>,
  LowercasedMethod extends Lowercase<Method> extends keyof Methods ? Lowercase<Method> : never,
  DefaultMethod extends 'get' extends LowercasedMethod ? 'get' : LowercasedMethod,
  ResT = Methods[DefaultMethod] extends Record<PropertyKey, any> ? FetchResponseData<Methods[DefaultMethod]> : never,
>(
  path: ReqT,
  options?: OpenAPIClientFetchOptions<Method, LowercasedMethod, Methods>
) => Promise<ResT>

declare module '#app' {
  interface NuxtApp {
    _pendingRequests?: Map<string, Promise<any>>
  }
}

function getPromiseMap(nuxt: NuxtApp) {
  return (nuxt._pendingRequests ||= new Map()) as Map<string, Promise<any>>
}

export async function _$api<T = unknown>(
  endpointId: string,
  path: string,
  opts: ApiClientFetchOptions & SharedFetchOptions = {},
) {
  const nuxt = useNuxtApp()
  const apiParty = useRuntimeConfig().public.apiParty

  const {
    path: pathParams,
    query,
    headers,
    method,
    body,
    client = allowClient === 'always',
    key,
    cache: _cache,
    ...fetchOptions
  } = opts

  if (client && !allowClient)
    throw new Error('Client-side API requests are disabled. Set "client: true" in the module options to enable them.')

  if (import.meta.dev && experimentalDisableClientPayloadCache && typeof _cache === 'boolean') {
    consola.error('[nuxt-api-party] Payload caching is disabled. Set `experimental.disableClientPayloadCache: false` in the module options to enable it.')
  }

  // Local caching support
  const enablePayloadCache = (!experimentalDisableClientPayloadCache && typeof _cache === 'boolean') ? _cache : false
  // Request cache mode
  const cache = typeof _cache === 'boolean' ? _cache ? 'default' : 'no-store' : _cache

  // TODO: Remove caching support from $api composable
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
      ...(isFormData(body) ? [] : [body]),
    ]))

    return _key
  }

  const endpoint = apiParty.endpoints[endpointId]!

  if (!experimentalDisableClientPayloadCache) {
    const k = getCacheKey()
    if ((nuxt.isHydrating || enablePayloadCache) && nuxt.payload.data[k]) {
      return nuxt.payload.data[k]
    }

    if (enablePayloadCache) {
      const result = getPromiseMap(nuxt).get(k)
      if (result) {
        return result
      }
    }
  }

  const fetchHooks = mergeFetchHooks(fetchOptions, {
    async onRequest(ctx) {
      await nuxt.callHook('api-party:request', ctx)
      // @ts-expect-error: Types will be generated on Nuxt prepare
      await nuxt.callHook(`api-party:request:${endpointId}`, ctx)
    },
    async onResponse(ctx) {
      // @ts-expect-error: Types will be generated on Nuxt prepare
      await nuxt.callHook(`api-party:response:${endpointId}`, ctx)
      await nuxt.callHook('api-party:response', ctx)
    },
  })

  const fetch = useRequestFetch()

  const clientFetcher = (baseURL: string) => fetch<T>(resolvePathParams(path, pathParams), {
    ...fetchOptions,
    ...fetchHooks,
    cache,
    baseURL,
    method,
    query: {
      ...endpoint.query,
      ...query,
    },
    headers: mergeHeaders(
      endpoint.token ? { Authorization: `Bearer ${endpoint.token}` } : undefined,
      endpoint.headers,
      headers,
    ),
    body,
  }) as Promise<T>

  const serverFetcher = async () =>
    (await fetch<T>(joinURL('/api', serverBasePath, endpointId), {
      ...fetchOptions,
      ...fetchHooks,
      cache,
      method: 'POST',
      body: {
        path: resolvePathParams(path, pathParams),
        query,
        headers: [...mergeHeaders(
          headers,
          endpoint.cookies ? useRequestHeaders(['cookie']) : undefined,
        )],
        method,
        body: await serializeMaybeEncodedBody(body),
      },
    })) as T

  const request = (allowClient && client
    ? clientFetcher(endpoint.url!)
    : experimentalEnablePrefixedProxy
      ? clientFetcher(joinURL('/api', serverBasePath, endpointId, 'proxy'))
      : serverFetcher())
    .then((response) => {
      if (!experimentalDisableClientPayloadCache && (import.meta.server || enablePayloadCache)) {
        const k = getCacheKey()
        nuxt.payload.data[k] = response
        getPromiseMap(nuxt).delete(k)
      }
      return response
    })
    // Invalidate cache if request fails
    .catch((error) => {
      if (!experimentalDisableClientPayloadCache && (import.meta.server || enablePayloadCache)) {
        const k = getCacheKey()
        nuxt.payload.data[k] = undefined
        getPromiseMap(nuxt).delete(k)
      }
      throw error
    }) as Promise<T>

  if (!experimentalDisableClientPayloadCache && (import.meta.server || enablePayloadCache)) {
    const k = getCacheKey()
    getPromiseMap(nuxt).set(k, request)
  }

  return request
}
