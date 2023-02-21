import { computed, reactive, unref } from 'vue'
import { hash } from 'ohash'
import type { FetchError } from 'ofetch'
import type { H3Event } from 'h3'
import type { NitroFetchOptions } from 'nitropack'
import type { Ref } from 'vue'
import type { AsyncData, AsyncDataOptions } from 'nuxt/app'
import type { ModuleOptions } from '../../module'
import { headersToObject, resolveUnref, serializeMaybeEncodedBody } from '../utils'
import type { EndpointFetchOptions, MaybeComputedRef } from '../utils'
import { isFormData } from '../formData'
import { useAsyncData, useNuxtApp, useRuntimeConfig } from '#imports'

type ComputedOptions<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends Function
    ? T[K]
    : T[K] extends Record<string, any>
      ? ComputedOptions<T[K]> | Ref<T[K]> | T[K]
      : Ref<T[K]> | T[K];
}

export type UseApiDataOptions<
  T,
  Transform extends (res: T) => any = (res: T) => T,
> = Pick<
  AsyncDataOptions<T, Transform>,
  | 'server'
  | 'lazy'
  | 'default'
  | 'transform'
  | 'watch'
  | 'immediate'
> & Pick<
  ComputedOptions<NitroFetchOptions<string>>,
  | 'onRequest'
  | 'onRequestError'
  | 'onResponse'
  | 'onResponseError'
  | 'query'
  | 'headers'
  | 'method'
> & {
  body?: string | Record<string, any> | FormData | null
  /**
   * Skip the Nuxt server proxy and fetch directly from the API.
   * Requires `allowClient` to be enabled in the module options as well.
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
) => AsyncData<T, FetchError>

export function _useApiData<
  T = any,
  Transform extends (res: T) => any = (res: T) => T,
>(
  endpointId: string,
  path: MaybeComputedRef<string>,
  opts: UseApiDataOptions<T, Transform> = {},
) {
  const { apiParty } = useRuntimeConfig().public
  const _path = computed(() => resolveUnref(path))
  const {
    server,
    lazy,
    default: defaultFn,
    transform,
    watch,
    immediate,
    query,
    headers,
    method,
    body,
    client = false,
    cache = true,
    ...fetchOptions
  } = opts

  if (client && !apiParty.allowClient)
    throw new Error('Client-side API requests are disabled. Set "allowClient: true" in the module options to enable them.')

  const endpoints = (apiParty as ModuleOptions).endpoints || {}
  const endpoint = endpoints[endpointId]

  const _fetchOptions = reactive(fetchOptions)

  const _endpointFetchOptions: EndpointFetchOptions = reactive({
    path: _path,
    query,
    headers: headersToObject(unref(headers)),
    method,
  })

  const _asyncDataOptions: AsyncDataOptions<T, Transform> = {
    server,
    lazy,
    default: defaultFn,
    transform,
    watch: [
      _endpointFetchOptions,
      ...(watch || []),
    ],
    immediate,
  }

  let controller: AbortController
  const key = computed(() => `$party${hash([
    endpointId,
    _path.value,
    unref(query),
    unref(method),
    ...(isFormData(body) ? [] : [body]),
  ])}`)

  const isLocalFetch = _path.value.startsWith('/')
  let _$fetch = globalThis.$fetch

  // Use fetch with request context and headers for server direct API calls
  if (process.server && isLocalFetch) {
    const event = useNuxtApp().ssrContext?.event as H3Event
    _$fetch = (event?.$fetch as typeof globalThis.$fetch) || globalThis.$fetch
  }

  return useAsyncData<T, FetchError, Transform>(
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
        result = (await _$fetch<T>(_path.value, {
          ..._fetchOptions,
          baseURL: endpoint.url,
          method: _endpointFetchOptions.method,
          query: {
            ...endpoint.query,
            ..._endpointFetchOptions.query,
          },
          headers: {
            ...(endpoint.token && { Authorization: `Bearer ${endpoint.token}` }),
            ...endpoint.headers,
            ..._endpointFetchOptions.headers,
          },
          body,
        })) as T
      }
      else {
        result = (await _$fetch<T>(
          `/api/__api_party/${endpointId}`,
          {
            ..._fetchOptions,
            signal: controller.signal,
            method: 'POST',
            body: {
              ..._endpointFetchOptions,
              body: await serializeMaybeEncodedBody(body),
            } satisfies EndpointFetchOptions,
          },
        )) as T
      }

      if (cache)
        nuxt!.payload.data[key.value] = result

      return result
    },
    _asyncDataOptions,
  ) as AsyncData<T, FetchError>
}
