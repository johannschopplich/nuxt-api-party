import { hash } from 'ohash'
import type { FetchOptions } from 'ofetch'
import { headersToObject, isFormData, serializeFormData } from '../utils'
import type { EndpointFetchOptions } from '../utils'
import { useNuxtApp } from '#imports'

export type ApiFetchOptions = Pick<
  FetchOptions,
  'onRequest' | 'onRequestError' | 'onResponse' | 'onResponseError' | 'query' | 'headers' | 'method'
> & {
  body?: string | Record<string, any> | FormData | null
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
  const promiseMap: Map<string, Promise<T>> = nuxt._promiseMap = nuxt._promiseMap || new Map()
  const { query, headers: rawHeaders, method, body: rawBody, cache = false, ...fetchOptions } = opts

  const headers = headersToObject(rawHeaders)
  let body = rawBody

  // Detect if body is a `FormData`
  if (isFormData(body)) {
    const serialized = serializeFormData(body)
    body = serialized.body
    Object.assign(headers, serialized.headers)
  }

  const endpointFetchOptions: EndpointFetchOptions = {
    path,
    query,
    headers,
    method,
    body,
  }

  const key = `$party${hash([endpointId, endpointFetchOptions])}`

  if ((nuxt.isHydrating || cache) && key in nuxt.payload.data)
    return Promise.resolve(nuxt.payload.data[key])

  if (promiseMap.has(key))
    return promiseMap.get(key)!

  const request = $fetch(`/api/__api_party/${endpointId}`, {
    ...fetchOptions,
    method: 'POST',
    body: endpointFetchOptions,
  }).then((response) => {
    if (process.server || cache)
      nuxt.payload.data[key] = response
    promiseMap.delete(key)
    return response
  }) as Promise<T>

  promiseMap.set(key, request)

  return request
}
