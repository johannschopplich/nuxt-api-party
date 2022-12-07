import { computed, reactive, unref } from 'vue'
import { hash } from 'ohash'
import type { FetchError, FetchOptions } from 'ofetch'
import type { Ref } from 'vue'
import type { AsyncData, AsyncDataOptions } from 'nuxt/app'
import { headersToObject, resolveUnref } from '../utils'
import type { EndpointFetchOptions, MaybeComputedRef } from '../utils'
import { useAsyncData } from '#imports'

type ComputedOptions<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends Function
    ? T[K]
    : T[K] extends Record<string, any>
      ? ComputedOptions<T[K]> | Ref<T[K]> | T[K]
      : Ref<T[K]> | T[K];
}

export type UseApiDataOptions<T> = Pick<
  AsyncDataOptions<T>,
  | 'server'
  | 'lazy'
  | 'default'
  | 'watch'
  | 'immediate'
> & Pick<
  ComputedOptions<FetchOptions>,
  | 'onRequest'
  | 'onRequestError'
  | 'onResponse'
  | 'onResponseError'
  // Pick from `globalThis.RequestInit`
  | 'query'
  | 'headers'
  | 'method'
> & {
  body?: Record<string, any>
}

export type UseApiData = <T = any>(
  path: MaybeComputedRef<string>,
  opts?: UseApiDataOptions<T>,
) => AsyncData<T, FetchError | null | true>

export function _useApiData<T = any>(
  endpointId: string,
  path: MaybeComputedRef<string>,
  opts: UseApiDataOptions<T> = {},
) {
  const _path = computed(() => resolveUnref(path))
  const {
    server,
    lazy,
    default: defaultFn,
    immediate,
    watch,
    query,
    headers,
    method,
    body,
    ...fetchOptions
  } = opts

  const _fetchOptions = reactive(fetchOptions)

  const endpointFetchOptions: EndpointFetchOptions = reactive({
    path: _path,
    query,
    headers: headersToObject(unref(headers)),
    method,
    body,
  })

  const asyncDataOptions: AsyncDataOptions<T> = {
    server,
    lazy,
    default: defaultFn,
    immediate,
    watch: [
      endpointFetchOptions,
      ...(watch || []),
    ],
  }

  let controller: AbortController
  const key = computed(() => `$party${hash([endpointId, endpointFetchOptions])}`)

  return useAsyncData<T, FetchError>(
    key.value,
    async (nuxt) => {
      controller?.abort?.()

      // Workaround to persist response client-side
      // https://github.com/nuxt/framework/issues/8917
      if (key.value in nuxt!.static.data)
        return nuxt!.static.data[key.value]

      controller = typeof AbortController !== 'undefined'
        ? new AbortController()
        : ({} as AbortController)

      const result = (await $fetch<T>(
        `/api/__api_party/${endpointId}`,
        {
          ..._fetchOptions,
          signal: controller.signal,
          method: 'POST',
          body: endpointFetchOptions,
        },
      )) as T

      nuxt!.static.data[key.value] = result

      return result
    },
    asyncDataOptions,
  ) as AsyncData<T, FetchError | null | true>
}
