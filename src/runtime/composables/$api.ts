import { hash } from 'ohash'
import type { FetchOptions } from 'ofetch'
import { headersToObject } from '../utils'
import type { EndpointFetchOptions } from '../utils'
import { useNuxtApp } from '#imports'

export type ApiFetchOptions = Pick<
  FetchOptions,
  'onRequest' | 'onRequestError' | 'onResponse' | 'onResponseError' | 'query' | 'headers' | 'method'
> & {
  body?: Record<string, any>
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
  const { query, headers, method, body, ...fetchOptions } = opts

  const promiseMap: Map<string, Promise<T>> = nuxt._promiseMap = nuxt._promiseMap || new Map()
  const key = `$party${hash([endpointId, path, query])}`

  if (key in nuxt.payload.data!)
    return Promise.resolve(nuxt.payload.data![key])

  if (promiseMap.has(key))
    return promiseMap.get(key)!

  const endpointFetchOptions: EndpointFetchOptions = {
    path,
    query,
    headers: headersToObject(headers),
    method,
    body,
  }

  const request = $fetch(`/api/__api_party/${endpointId}`, {
    ...fetchOptions,
    method: 'POST',
    body: endpointFetchOptions,
  }).then((response) => {
    if (process.server)
      nuxt.payload.data![key] = response
    promiseMap.delete(key)
    return response
  }) as Promise<T>

  promiseMap.set(key, request)

  return request
}
