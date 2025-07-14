import type { FetchOptions, FetchRequest } from 'ofetch'
import { useNuxtApp } from '#app'
import { $fetch } from 'ofetch'
import { hash } from 'ohash'
import { CACHE_KEY_PREFIX } from './constants'
import { isFormData } from './form-data'

declare module '#app' {
  interface NuxtApp {
    _pendingRequests?: Map<string, Promise<any>>
  }
}

/**
 * A `$fetch` function which caches responses in the Nuxt payload.
 *
 * This is useful for backends which don't provide caching headers or POST
 * requests, which are not cached by the browser.
 *
 * TODO: externalize this to an extensible user-facing module
 */
export const cachedFetch = import.meta.server
  ? undefined
  : <T>(url: FetchRequest, options?: FetchOptions<any, T>) => {
      const nuxt = useNuxtApp()
      const promiseMap = (nuxt._pendingRequests ||= new Map<string, Promise<T>>())
      const cacheKey = `${CACHE_KEY_PREFIX}$cache${hash([
        url,
        options?.query,
        options?.method,
        isFormData(options?.body) ? [] : [options!.body],
      ])}`

      if (nuxt.payload.data[cacheKey]) {
        return Promise.resolve(nuxt.payload.data[cacheKey] as T)
      }

      if (promiseMap.has(cacheKey)) {
        return promiseMap.get(cacheKey)!
      }

      const request = $fetch<T>(url, options)
        .then((response) => {
          nuxt.payload.data[cacheKey] = response
          promiseMap.delete(cacheKey)
          return response
        })
        // Invalidate cache if request fails
        .catch((error) => {
          nuxt.payload.data[cacheKey] = undefined
          promiseMap.delete(cacheKey)
          throw error
        })

      promiseMap.set(cacheKey, request)

      return request
    }
