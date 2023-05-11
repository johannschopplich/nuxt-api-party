import { hash } from 'ohash'
import type { NitroFetchOptions } from 'nitropack'
import { headersToObject, serializeMaybeEncodedBody } from '../utils'
import { isFormData } from '../formData'
import type { ModuleOptions } from '../../module'
import type { EndpointFetchOptions } from '../utils'
import { useNuxtApp, useRuntimeConfig } from '#imports'

export type ApiFetchOptions = Omit<NitroFetchOptions<string>, 'body' | 'cache'> & {
  body?: string | Record<string, any> | FormData | null
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

export type $Api = <T = any>(
  path: string,
  opts?: ApiFetchOptions,
) => Promise<T>

export function _$api<T = any>(
  endpointId: string,
  path: string,
  opts: ApiFetchOptions = {},
): Promise<T> {
  const nuxt = useNuxtApp()
  const promiseMap = (nuxt._promiseMap = nuxt._promiseMap || new Map()) as Map<string, Promise<T>>
  const { query, headers, method, body, client = false, cache = false, ...fetchOptions } = opts
  const { apiParty } = useRuntimeConfig().public
  const key = `$party${hash([
    endpointId,
    path,
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

  const endpoints = (apiParty as ModuleOptions).endpoints || {}
  const endpoint = endpoints[endpointId]

  const clientFetcher = () => globalThis.$fetch<T>(path, {
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
        path,
        query,
        headers: headersToObject(headers),
        method,
        body: await serializeMaybeEncodedBody(body),
      } satisfies EndpointFetchOptions,
    })) as T

  const request = (client ? clientFetcher() : serverFetcher()).then((response) => {
    if (process.server || cache)
      nuxt.payload.data[key] = response
    promiseMap.delete(key)
    return response
  }) as Promise<T>

  promiseMap.set(key, request)

  return request
}
