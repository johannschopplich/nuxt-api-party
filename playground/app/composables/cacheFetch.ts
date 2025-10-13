import type { H3Event$Fetch } from 'nitropack/types'

import { useRequestFetch } from '#app'
import { hash } from 'ohash'
import { createStorage } from 'unstorage'
import indexedDbDriver from 'unstorage/drivers/indexedb'

import { mergeFetchHooks } from '../../../src/runtime/hooks'

export function useIDBCacheFetch({ dbName, storeName = 'cache', base }: { dbName?: string, storeName?: string, base?: string }): H3Event$Fetch {
  if (import.meta.server) {
    return useRequestFetch()
  }
  const storage = createStorage({
    driver: indexedDbDriver({ dbName, storeName, base }),
  })
  return async (request, options) => {
    const { cache = 'default' } = options ?? {}

    const canCache = ['get', 'head'].includes(options?.method?.toLowerCase() ?? 'get')
    const key = hash([request, options?.method?.toUpperCase() ?? 'GET', options?.baseURL, options?.query || options?.params])
    if (canCache && !['no-cache', 'reload'].includes(cache)) {
      const response = await storage.getItemRaw(key)
      if (response) {
        return response.data
      }
    }

    return await $fetch(request, {
      ...options,
      ...mergeFetchHooks(options ?? {}, {
        async onResponse({ response }) {
          if (!canCache || cache === 'no-store') {
            return
          }
          await storage.setItemRaw(key, { data: response._data })
        },
      }),
    })
  }
}
