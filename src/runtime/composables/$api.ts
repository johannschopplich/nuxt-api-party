import { hash } from 'ohash'
import type { NitroFetchOptions } from 'nitropack'
import { headersToObject, resolvePath, serializeMaybeEncodedBody } from '../utils'
import { isFormData } from '../formData'
import type { ModuleOptions } from '../../module'
import type { EndpointFetchOptions } from '../utils'
import type { AllPaths, GETPaths, GETPlainPaths, HttpMethod, IgnoreCase, OpenApiRequestOptions, OpenApiResponse, PathItemObject } from '../types'
import { useNuxtApp, useRequestHeaders, useRuntimeConfig } from '#imports'

export interface BaseApiFetchOptions {
  /**
   * Skip the Nuxt server proxy and fetch directly from the API.
   * Requires `allowClient` to be enabled in the module options as well.
   * @default false
   */
  client?: boolean
  /**
   * Cache the response for the same request
   * @default false
   */
  cache?: boolean
}

export type ApiFetchOptions = Omit<NitroFetchOptions<string>, 'body' | 'cache'> & {
  pathParams?: Record<string, string>
  body?: string | Record<string, any> | FormData | null
}

export type $Api = <T = any>(
  path: string,
  opts?: ApiFetchOptions & BaseApiFetchOptions,
) => Promise<T>

export interface $OpenApi<Paths extends Record<string, PathItemObject>> {
  <P extends GETPlainPaths<Paths>>(
    path: P,
    opts?: BaseApiFetchOptions & Omit<OpenApiRequestOptions<Paths[`/${P}`]>, 'method'>
  ): Promise<OpenApiResponse<Paths[`/${P}`]['get']>>
  <P extends GETPaths<Paths>>(
    path: P,
    opts: BaseApiFetchOptions & Omit<OpenApiRequestOptions<Paths[`/${P}`]>, 'method'>
  ): Promise<OpenApiResponse<Paths[`/${P}`]['get']>>
 <P extends AllPaths<Paths>, M extends IgnoreCase<keyof Paths[`/${P}`] & HttpMethod>>(
    path: P,
    opts?: BaseApiFetchOptions & OpenApiRequestOptions<Paths[`/${P}`], M> & { method: M }
  ): Promise<OpenApiResponse<Paths[`/${P}`][Lowercase<M>]>>
}

export function _$api<T = any>(
  endpointId: string,
  path: string,
  opts: ApiFetchOptions & BaseApiFetchOptions = {},
): Promise<T> {
  const nuxt = useNuxtApp()
  const { apiParty } = useRuntimeConfig().public
  const promiseMap = (nuxt._promiseMap = nuxt._promiseMap || new Map()) as Map<string, Promise<T>>

  const {
    pathParams,
    query,
    headers,
    method,
    body,
    client = false,
    cache = false,
    ...fetchOptions
  } = opts

  const key = `$party${hash([
    endpointId,
    path,
    pathParams,
    query,
    method,
    ...(isFormData(body) ? [] : [body]),
  ])}`

  if (client && !apiParty.allowClient)
    throw new Error('Client-side API requests are disabled. Set "allowClient: true" in the module options to enable them.')

  if ((nuxt.isHydrating || cache) && key in nuxt.payload.data)
    return Promise.resolve(nuxt.payload.data[key])

  if (promiseMap.has(key))
    return promiseMap.get(key)!

  const endpoints = (apiParty as unknown as ModuleOptions).endpoints || {}
  const endpoint = endpoints[endpointId]

  const clientFetcher = () => globalThis.$fetch<T>(resolvePath(path, pathParams), {
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
        path: resolvePath(path, pathParams),
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
        nuxt.payload.data[key] = response
      promiseMap.delete(key)
      return response
    })
    // Invalidate cache if request fails
    .catch((error) => {
      if (key in nuxt.payload.data)
        delete nuxt.payload.data[key]
      promiseMap.delete(key)
      throw error
    }) as Promise<T>

  promiseMap.set(key, request)

  return request
}
