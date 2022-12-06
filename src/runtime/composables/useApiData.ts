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
  request: MaybeComputedRef<string>,
  opts?: UseApiDataOptions<T>,
) => AsyncData<T, FetchError | null | true>

export function _useApiData<T = any>(
  endpointId: string,
  request: MaybeComputedRef<string>,
  opts: UseApiDataOptions<T> = {},
) {
  const _request = computed(() => resolveUnref(request))

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
    request: _request.value,
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
      _request,
      endpointFetchOptions,
      ...(watch || []),
    ],
  }

  let controller: AbortController

  return useAsyncData<T, FetchError>(
    `$party${hash([endpointId, _request.value, unref(query)])}`,
    () => {
      controller?.abort?.()
      controller = typeof AbortController !== 'undefined' ? new AbortController() : {} as AbortController

      return $fetch(`/api/__api_party/${endpointId}`, {
        ..._fetchOptions,
        signal: controller.signal,
        method: 'POST',
        body: endpointFetchOptions,
      }) as Promise<T>
    },
    asyncDataOptions,
  ) as AsyncData<T, FetchError | null | true>
}
