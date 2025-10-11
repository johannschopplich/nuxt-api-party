import type { H3Event$Fetch } from 'nitropack/types'

import { useRequestFetch } from '#app'
import { withBase, withQuery } from 'ufo'
import { mergeFetchHooks } from '../../../src/runtime/hooks'

export function useCacheStorageFetch(): H3Event$Fetch {
  if (import.meta.server) {
    return useRequestFetch()
  }

  let _c: Cache
  async function useCache() {
    return _c ||= await window.caches.open('api-party')
  }

  return async (request, options) => {
    const { responseType = 'json', cache } = options ?? {}

    const canCache = ['get', 'head'].includes(options?.method?.toLowerCase() ?? 'get')
    if (canCache && responseType !== 'stream' && cache !== 'no-cache') {
      // rebuild the full url using the options query and baseURL
      let url = typeof request === 'string' ? request : request.url
      if (options?.baseURL) {
        url = withBase(url, options.baseURL)
      }
      const query = options?.query || options?.params
      if (query) {
        url = withQuery(url, query)
      }
      const c = await useCache()
      const response = await c.match(url)
      if (response) {
        return await response[responseType]()
      }
    }

    return await $fetch(request, {
      ...options,
      ...mergeFetchHooks(options ?? {}, {
        async onResponse({ request, response, options }) {
          if (!canCache || responseType === 'stream' || cache === 'no-store') {
            return
          }
          const c = await useCache()
          // ofetch consumes the Response, so make a new one.
          await c.put(request, new Response(
            options.responseType === 'json' ? JSON.stringify(response?._data) : response._data,
            {
              headers: response.headers,
              status: response.status,
              statusText: response.statusText,
            },
          ))
        },
      }),
    })
  }
}
