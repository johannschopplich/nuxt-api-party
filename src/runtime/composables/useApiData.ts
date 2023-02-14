import { computed, reactive, unref } from 'vue'
import { hash } from 'ohash'
import type { FetchError } from 'ofetch'
import type { NitroFetchOptions } from 'nitropack'
import type { Ref } from 'vue'
import type { AsyncData, AsyncDataOptions } from 'nuxt/app'
import type { ModuleOptions } from '../../module'
import { headersToObject, resolveUnref, serializeMaybeEncodedBody } from '../utils'
import type { EndpointFetchOptions, MaybeComputedRef } from '../utils'
import { isFormData } from '../formData'
import { useAsyncData, useRuntimeConfig } from '#imports'

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
  ComputedOptions<NitroFetchOptions<string>>,
  | 'onRequest'
  | 'onRequestError'
  | 'onResponse'
  | 'onResponseError'
  // Pick from `globalThis.RequestInit`
  | 'query'
  | 'headers'
  | 'method'
> & {
  body?: string | Record<string, any> | FormData | null
  /**
   * Skip the Nuxt server proxy and fetch directly from the API.
   * Requires `client` to be enabled in the module options as well.
   * @default false
   */
  client?: boolean
  /**
   * Cache the response for the same request
   * @default true
   */
  cache?: boolean
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
  const { apiParty } = useRuntimeConfig().public
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
    client = false,
    cache = true,
    ...fetchOptions
  } = opts

  if (client && !apiParty.client)
    throw new Error('Client-side API requests are disabled. Set "client: true" in the module options to enable them.')

  const endpoints = (apiParty as ModuleOptions).endpoints!
  const endpoint = endpoints[endpointId]

  const _fetchOptions = reactive(fetchOptions)

  const endpointFetchOptions: EndpointFetchOptions = reactive({
    path: _path,
    query,
    headers: headersToObject(unref(headers)),
    method,
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
  const key = computed(() => `$party${hash([
    endpointId,
    _path.value,
    unref(query),
    unref(method),
    ...(isFormData(body) ? [] : [body]),
  ])}`)

  return useAsyncData<T, FetchError>(
    key.value,
    async (nuxt) => {
      controller?.abort?.()

      // Workaround to persist response client-side
      // https://github.com/nuxt/framework/issues/8917
      if ((nuxt!.isHydrating || cache) && key.value in nuxt!.payload.data)
        return nuxt!.payload.data[key.value]

      controller = typeof AbortController !== 'undefined'
        ? new AbortController()
        : ({} as AbortController)

      let result: T

      if (client) {
        result = (await $fetch<T>(_path.value, {
          ..._fetchOptions,
          baseURL: endpoint.url,
          method: unref(method),
          query: {
            ...endpoint.query,
            ...unref(query),
          },
          headers: {
            ...(endpoint.token && { Authorization: `Bearer ${endpoint.token}` }),
            ...endpoint.headers,
            ...headersToObject(unref(headers)),
          },
          body,
        })) as T
      }
      else {
        result = (await $fetch<T>(
          `/api/__api_party/${endpointId}`,
          {
            ..._fetchOptions,
            signal: controller.signal,
            method: 'POST',
            body: {
              ...endpointFetchOptions,
              body: await serializeMaybeEncodedBody(body),
            } satisfies EndpointFetchOptions,
          },
        )) as T
      }

      if (cache)
        nuxt!.payload.data[key.value] = result

      return result
    },
    asyncDataOptions,
  ) as AsyncData<T, FetchError | null | true>
}
