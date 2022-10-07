import { computed } from 'vue'
import { hash } from 'ohash'
import type { ComputedRef, Ref } from 'vue'
import type { FetchError } from 'ohmyfetch'
import type { AsyncData, AsyncDataOptions, UseFetchOptions } from 'nuxt/app'
import { apiServerRoute, headersToObject } from '../utils'
import { useAsyncData } from '#imports'

export type MaybeComputedRef<T> = (() => T) | ComputedRef<T> | Ref<T> | T

export type UseApiDataOptions<T> = Pick<
  UseFetchOptions<T>,
  // Pick from `AsyncDataOptions`
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
  uri: MaybeComputedRef<string>,
  opts: UseApiDataOptions<T> = {},
) {
  const _uri = computed(() => resolveUnref(uri))

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
      _uri,
    ],
  }

  return useAsyncData<T, FetchError>(
    `$party${hash(_uri.value)}`,
    () => {
      return $fetch(apiServerRoute, {
        ...fetchOptions,
        method: 'POST',
        body: {
          uri: _uri.value,
          headers: headersToObject(headers),
        },
      }) as Promise<T>
    },
    asyncDataOptions,
  ) as AsyncData<T, FetchError | null | true>
}

function resolveUnref<T>(r: MaybeComputedRef<T>): T {
  return typeof r === 'function'
    ? (r as any)()
    : unref(r)
}
