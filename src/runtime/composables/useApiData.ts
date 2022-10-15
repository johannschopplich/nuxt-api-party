import { computed } from 'vue'
import { hash } from 'ohash'
import type { FetchError } from 'ohmyfetch'
import type { AsyncData, AsyncDataOptions, UseFetchOptions } from 'nuxt/app'
import { apiServerRoute, headersToObject, resolveUnref } from '../utils'
import type { MaybeComputedRef } from '../utils'
import { useAsyncData } from '#imports'

export type UseApiDataOptions<T> = Pick<
  UseFetchOptions<T>,
  // Pick from `AsyncDataOptions`
  | 'server'
  | 'lazy'
  | 'default'
  | 'watch'
  | 'initialCache'
  | 'immediate'
  // Pick from `FetchOptions`
  | 'onRequest'
  | 'onRequestError'
  | 'onResponse'
  | 'onResponseError'
  // Pick from `globalThis.RequestInit`
  | 'headers'
>

export function useApiData<T = any>(
  path: MaybeComputedRef<string>,
  opts: UseApiDataOptions<T> = {},
) {
  const _path = computed(() => resolveUnref(path))

  const {
    lazy,
    default: defaultFn,
    initialCache,
    immediate,
    headers,
    ...fetchOptions
  } = opts

  const asyncDataOptions: AsyncDataOptions<T> = {
    lazy,
    default: defaultFn,
    initialCache,
    immediate,
    watch: [
      _path,
    ],
  }

  return useAsyncData<T, FetchError>(
    `$party${hash(_path.value)}`,
    () => {
      return $fetch(apiServerRoute, {
        ...fetchOptions,
        method: 'POST',
        body: {
          path: _path.value,
          headers: headersToObject(headers),
        },
      }) as Promise<T>
    },
    asyncDataOptions,
  ) as AsyncData<T, FetchError | null | true>
}
