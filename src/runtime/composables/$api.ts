import { hash } from 'ohash'
import type { FetchOptions } from 'ofetch'
import { headersToObject } from '../utils'
import { useNuxtApp } from '#imports'

export type ApiFetchOptions = Pick<
  FetchOptions,
  'onRequest' | 'onRequestError' | 'onResponse' | 'onResponseError' | 'headers'
>

export declare function $api<T = any>(
  path: string,
  opts?: ApiFetchOptions,
): Promise<T>

export function _$api<T = any>(
  endpointId: string,
  path: string,
  opts: ApiFetchOptions = {},
): Promise<T> {
  const nuxt = useNuxtApp()
  const { headers, ...fetchOptions } = opts

  const promiseMap: Map<string, Promise<T>> = nuxt._promiseMap = nuxt._promiseMap || new Map()
  const key = `$party${hash(path)}`

  if (key in nuxt.payload.data!)
    return Promise.resolve(nuxt.payload.data![key])

  if (promiseMap.has(key))
    return promiseMap.get(key)!

  const request = $fetch(`/api/__api_party__/${endpointId}`, {
    ...fetchOptions,
    method: 'POST',
    body: {
      path,
      headers: headersToObject(headers),
    },
  }).then((response) => {
    nuxt.payload.data![key] = response
    promiseMap.delete(key)
    return response
  }) as Promise<T>

  promiseMap.set(key, request)

  return request
}
