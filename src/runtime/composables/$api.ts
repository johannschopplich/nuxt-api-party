import { hash } from 'ohash'
import type { NitroFetchOptions } from 'nitropack'
import { headersToObject, resolvePathParams, serializeMaybeEncodedBody } from '../utils'
import { isFormData } from '../formData'
import type { ModuleOptions } from '../../module'
import { CACHE_KEY_PREFIX } from '../constants'
import type { EndpointFetchOptions } from '../types'
import type { AllPaths, ApiResponse, CaseVariants, GetPaths, GetPlainPaths, HttpMethod, RequestOptions, SchemaPath } from '../openapi'
import { useNuxtApp, useRequestHeaders, useRuntimeConfig } from '#imports'

export interface BaseApiFetchOptions {
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

export type ApiFetchOptions = Omit<NitroFetchOptions<string>, 'body' | 'cache'> & {
  pathParams?: Record<string, string>
  body?: string | Record<string, any> | FormData | null
}

export type $Api = <T = any>(
  path: string,
  opts?: ApiFetchOptions & BaseApiFetchOptions,
) => Promise<T>

export interface $OpenAPI<Paths extends Record<string, SchemaPath>> {
  <P extends GetPlainPaths<Paths>>(
    path: P,
    opts?: BaseApiFetchOptions & Omit<RequestOptions<Paths[`/${P}`]>, 'method'>
  ): Promise<ApiResponse<Paths[`/${P}`]['get']>>
  <P extends GetPaths<Paths>>(
    path: P,
    opts: BaseApiFetchOptions & Omit<RequestOptions<Paths[`/${P}`]>, 'method'>
  ): Promise<ApiResponse<Paths[`/${P}`]['get']>>
  <P extends AllPaths<Paths>, M extends CaseVariants<keyof Paths[`/${P}`] & HttpMethod>>(
    path: P,
    opts?: BaseApiFetchOptions & RequestOptions<Paths[`/${P}`], M> & { method: M }
  ): Promise<ApiResponse<Paths[`/${P}`][Lowercase<M>]>>
}

export function _$api<T = any>(
  endpointId: string,
  path: string,
  opts: ApiFetchOptions & BaseApiFetchOptions = {},
) {
  const nuxt = useNuxtApp()
  const apiParty = useRuntimeConfig().public.apiParty as Required<ModuleOptions>
  const promiseMap = (nuxt._promiseMap = nuxt._promiseMap || new Map()) as Map<string, Promise<T>>

  const {
    pathParams,
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
    (await globalThis.$fetch<T>(`/api/__api_party/${endpointId}`, {
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
      if (process.server || cache)
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
