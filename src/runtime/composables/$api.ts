import { hash } from 'ohash'
import type { FetchOptions } from 'ofetch'
import type { QueryObject } from 'ufo'
import { headersToObject } from '../utils'
import { useNuxtApp } from '#imports'

export type ApiFetchOptions = Pick<
  FetchOptions,
  'onRequest' | 'onRequestError' | 'onResponse' | 'onResponseError' | 'headers' | 'method'
> & {
  query?: QueryObject
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
  const { query, method, body, headers, ...fetchOptions } = opts

  const promiseMap: Map<string, Promise<T>> = nuxt._promiseMap = nuxt._promiseMap || new Map()
  const key = `$party${hash([endpointId, path, query, method, body, headers])}`

  if (key in nuxt.payload.data!)
    return Promise.resolve(nuxt.payload.data![key])

  if (promiseMap.has(key))
    return promiseMap.get(key)!

  const request = $fetch(`/api/__api_party__/${endpointId}`, {
    ...fetchOptions,
    method: 'POST',
    body: {
      path,
      query,
      method,
      body,
      headers: headersToObject(headers),
    },
  }).then((response) => {
    if (process.server)
      nuxt.payload.data![key] = response
    promiseMap.delete(key)
    return response
  }) as Promise<T>

  promiseMap.set(key, request)

  return request
}
