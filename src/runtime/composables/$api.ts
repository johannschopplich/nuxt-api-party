import { hash } from 'ohash'
import type { NitroFetchOptions } from 'nitropack'
import { headersToObject, serializeMaybeEncodedBody } from '../utils'
import type { EndpointFetchOptions } from '../utils'
import { useNuxtApp } from '#imports'

export type ApiFetchOptions = Pick<
  NitroFetchOptions<string>,
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
  const { query, headers, method, body, cache = false, ...fetchOptions } = opts
  const key = `$party${hash([endpointId, path, query, method, body])}`

  if ((nuxt.isHydrating || cache) && key in nuxt.payload.data)
    return Promise.resolve(nuxt.payload.data[key])

  if (promiseMap.has(key))
    return promiseMap.get(key)!

  const endpointFetchOptions: EndpointFetchOptions = {
    path,
    query,
    headers: headersToObject(headers),
    method,
  }

  const fetcher = async () =>
    (await $fetch(`/api/__api_party/${endpointId}`, {
      ...fetchOptions,
      method: 'POST',
      body: {
        ...endpointFetchOptions,
        body: await serializeMaybeEncodedBody(body),
      },
    })) as T

  const request = fetcher().then((response) => {
    if (process.server || cache)
      nuxt.payload.data[key] = response
    promiseMap.delete(key)
    return response
  }) as Promise<T>

  promiseMap.set(key, request)

  return request
}
