import type { NitroFetchOptions } from 'nitropack'
import type { ModuleOptions } from '../../module'
import type { FetchResponseData, FilterMethods, MethodOption, ParamsOption, RequestBodyOption } from '../openapi'
import type { EndpointFetchOptions } from '../types'
import { useNuxtApp, useRequestHeaders, useRuntimeConfig } from '#imports'
import { hash } from 'ohash'
import { joinURL } from 'ufo'
import { CACHE_KEY_PREFIX } from '../constants'
import { isFormData } from '../form-data'
import { resolvePathParams } from '../openapi'
import { headersToObject, serializeMaybeEncodedBody } from '../utils'

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
   * Cache the response for the same request.
   * You can customize the cache key with the `key` option.
   * @default false
   */
  cache?: boolean
  /**
   * By default, a cache key will be generated from the request options.
   * With this option, you can provide a custom cache key.
   * @default undefined
   */
  key?: string
}

export type ApiClientFetchOptions =
  Omit<NitroFetchOptions<string>, 'body' | 'cache'>
  & {
    path?: Record<string, string>
    body?: string | Record<string, any> | FormData | null
  }

export type OpenAPIClientFetchOptions<
  Method,
  LowercasedMethod,
  Params,
  Operation = 'get' extends LowercasedMethod ? ('get' extends keyof Params ? Params['get'] : never) : LowercasedMethod extends keyof Params ? Params[LowercasedMethod] : never,
> =
  MethodOption<Method, Params>
  & ParamsOption<Operation>
  & RequestBodyOption<Operation>
  & Omit<NitroFetchOptions<string>, 'query' | 'body' | 'method' | 'cache'>
  & SharedFetchOptions

export type ApiClient = <T = unknown>(
  path: string,
  opts?: ApiClientFetchOptions & SharedFetchOptions,
) => Promise<T>

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

export function _$api<T = unknown>(
  endpointId: string,
  path: string,
  opts: ApiClientFetchOptions & SharedFetchOptions = {},
) {
  const nuxt = useNuxtApp()
  const apiParty = useRuntimeConfig().public.apiParty as Required<ModuleOptions>
  const promiseMap = (nuxt._pendingRequests ||= new Map()) as Map<string, Promise<T>>

  const {
    path: pathParams,
    query,
    headers,
    method,
    body,
    client = apiParty.client === 'always',
    cache = false,
    key,
    ...fetchOptions
  } = opts

  const _key = key === undefined
    ? CACHE_KEY_PREFIX + hash([
      endpointId,
      path,
      pathParams,
      query,
      method,
      ...(isFormData(body) ? [] : [body]),
    ])
    : CACHE_KEY_PREFIX + key

  if (client && !apiParty.client)
    throw new Error('Client-side API requests are disabled. Set "client: true" in the module options to enable them.')

  if ((nuxt.isHydrating || cache) && nuxt.payload.data[_key])
    return Promise.resolve(nuxt.payload.data[_key])

  if (promiseMap.has(_key))
    return promiseMap.get(_key)!

  const endpoint = (apiParty.endpoints || {})[endpointId]

  const clientFetcher = () => globalThis.$fetch<T>(resolvePathParams(path, pathParams), {
    ...fetchOptions,
    baseURL: endpoint.url,
    method,
    query: {
      ...endpoint.query,
      ...query,
    },
    headers: {
      ...(endpoint.token && { Authorization: `Bearer ${endpoint.token}` }),
      ...endpoint.headers,
      ...headersToObject(headers),
    },
    body,
  }) as Promise<T>

  const serverFetcher = async () =>
    (await globalThis.$fetch<T>(joinURL('/api', apiParty.server.basePath!, endpointId), {
      ...fetchOptions,
      method: 'POST',
      body: {
        path: resolvePathParams(path, pathParams),
        query,
        headers: {
          ...headersToObject(headers),
          ...(endpoint.cookies && useRequestHeaders(['cookie'])),
        },
        method,
        body: await serializeMaybeEncodedBody(body),
      } satisfies EndpointFetchOptions,
    })) as T

  const request = (client ? clientFetcher() : serverFetcher())
    .then((response) => {
      if (import.meta.server || cache)
        nuxt.payload.data[_key] = response
      promiseMap.delete(_key)
      return response
    })
    // Invalidate cache if request fails
    .catch((error) => {
      nuxt.payload.data[_key] = undefined
      promiseMap.delete(_key)
      throw error
    }) as Promise<T>

  promiseMap.set(_key, request)

  return request
}
