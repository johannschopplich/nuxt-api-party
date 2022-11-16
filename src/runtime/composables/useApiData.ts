import { computed, unref } from 'vue'
import { hash } from 'ohash'
import type { FetchError, FetchOptions } from 'ofetch'
import type { AsyncData, AsyncDataOptions } from 'nuxt/app'
import { apiServerRoute, headersToObject, resolveUnref } from '../utils'
import type { MaybeComputedRef } from '../utils'
import { useAsyncData } from '#imports'

export type UseApiDataOptions<T> = Pick<
  AsyncDataOptions<T>,
  | 'server'
  | 'lazy'
  | 'default'
  | 'watch'
  | 'immediate'
> & Pick<
  FetchOptions,
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
    immediate,
    headers,
    ...fetchOptions
  } = opts

  const asyncDataOptions: AsyncDataOptions<T> = {
    lazy,
    default: defaultFn,
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
          headers: headersToObject(unref(headers)),
        },
      }) as Promise<T>
    },
    asyncDataOptions,
  ) as AsyncData<T, FetchError | null | true>
}
