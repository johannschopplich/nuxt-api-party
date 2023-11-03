import { computed, reactive } from 'vue'
import { hash } from 'ohash'
import type { FetchError } from 'ofetch'
import type { NitroFetchOptions } from 'nitropack'
import type { WatchSource } from 'vue'
import type { AsyncData, AsyncDataOptions } from 'nuxt/app'
import type { ModuleOptions } from '../../module'
import { CACHE_KEY_PREFIX } from '../constants'
import { headersToObject, resolvePathParams, serializeMaybeEncodedBody, toValue } from '../utils'
import { isFormData } from '../formData'
import type { EndpointFetchOptions, MaybeRef, MaybeRefOrGetter } from '../types'
import type { AllPaths, ApiError, ApiResponse, CaseVariants, GetPaths, GetPlainPaths, HttpMethod, RequestOptions, SchemaPath } from '../openapi'
import { useAsyncData, useRequestHeaders, useRuntimeConfig } from '#imports'

type ComputedOptions<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? T[K]
    : T[K] extends Record<string, any>
      ? ComputedOptions<T[K]> | MaybeRef<T[K]>
      : MaybeRef<T[K]>;
}

export type BaseUseApiDataOptions<ResT, DataT = ResT> = Omit<AsyncDataOptions<ResT, DataT>, 'watch'> & {
  /**
   * Skip the Nuxt server proxy and fetch directly from the API.
   * Requires `client` set to `true` in the module options.
   * @remarks
   * If Nuxt SSR is disabled, client-side requests are enabled by default.
   * @default false
   */
  client?: boolean
  /**
   * Cache the response for the same request.
   * You can customize the cache key with the `key` option.
   * @default true
   */
  cache?: boolean
  /**
   * By default, a cache key will be generated from the request options.
   * With this option, you can provide a custom cache key.
   * @default undefined
   */
  key?: MaybeRefOrGetter<string>
  /**
   * Watch an array of reactive sources and auto-refresh the fetch result when they change.
   * Fetch options and URL are watched by default. You can completely ignore reactive sources by using `watch: false`.
   * @default undefined
   */
  watch?: (WatchSource<unknown> | object)[] | false
}

export type UseApiDataOptions<T> = Pick<
  ComputedOptions<NitroFetchOptions<string>>,
  | 'onRequest'
  | 'onRequestError'
  | 'onResponse'
  | 'onResponseError'
  | 'query'
  | 'headers'
  | 'method'
  | 'retry'
  | 'retryDelay'
  | 'timeout'
> & {
  pathParams?: MaybeRefOrGetter<Record<string, string>>
  body?: MaybeRef<string | Record<string, any> | FormData | null>
} & BaseUseApiDataOptions<T>

export type UseOpenAPIDataOptions<
  P extends SchemaPath,
  M extends CaseVariants<keyof P & HttpMethod> = CaseVariants<keyof P & 'get'>,
  ResT = ApiResponse<P[Lowercase<M>]>,
  DataT = ResT,
> = BaseUseApiDataOptions<ResT, DataT> & ComputedOptions<RequestOptions<P, M>>

export type UseApiData = <T = any>(
  path: MaybeRefOrGetter<string>,
  opts?: UseApiDataOptions<T>,
) => AsyncData<T | undefined, FetchError>

export interface UseOpenAPIData<Paths extends Record<string, SchemaPath>> {
  <P extends GetPlainPaths<Paths>, ResT = ApiResponse<Paths[`/${P}`]['get']>, DataT = ResT>(
    path: MaybeRefOrGetter<P>,
    opts?: Omit<UseOpenAPIDataOptions<Paths[`/${P}`], CaseVariants<keyof Paths[`/${P}`] & HttpMethod>, ResT, DataT>, 'method'>,
  ): AsyncData<DataT, FetchError<ApiError<Paths[`/${P}`]['get']>>>
  <P extends GetPaths<Paths>, ResT = ApiResponse<Paths[`/${P}`]['get']>, DataT = ResT>(
    path: MaybeRefOrGetter<P>,
    opts: Omit<UseOpenAPIDataOptions<Paths[`/${P}`], CaseVariants<keyof Paths[`/${P}`] & HttpMethod>, ResT, DataT>, 'method'>,
  ): AsyncData<DataT, FetchError<ApiError<Paths[`/${P}`]['get']>>>
  <P extends AllPaths<Paths>, M extends CaseVariants<keyof Paths[`/${P}`] & HttpMethod>, ResT = ApiResponse<Paths[`/${P}`][Lowercase<M>]>, DataT = ResT>(
    path: MaybeRefOrGetter<P>,
    opts: UseOpenAPIDataOptions<Paths[`/${P}`], M, ResT, DataT> & { method: M },
  ): AsyncData<DataT, FetchError<ApiError<Paths[`/${P}`][Lowercase<M>]>>>
}

export function _useApiData<T = any>(
  endpointId: string,
  path: MaybeRefOrGetter<string>,
  opts: UseApiDataOptions<T> = {},
) {
  const apiParty = useRuntimeConfig().public.apiParty as unknown as Required<ModuleOptions>
  const {
    server,
    lazy,
    default: defaultFn,
    transform,
    pick,
    watch,
    immediate,
    pathParams,
    query,
    headers,
    method,
    body,
    client = apiParty.client === 'always',
    cache = true,
    key,
    ...fetchOptions
  } = opts

  const _path = computed(() => resolvePathParams(toValue(path), toValue(pathParams)))
  const _key = computed(key === undefined
    ? () => CACHE_KEY_PREFIX + hash([
        endpointId,
        _path.value,
        toValue(query),
        toValue(method),
        ...(isFormData(toValue(body)) ? [] : [toValue(body)]),
      ])
    : () => CACHE_KEY_PREFIX + toValue(key),
  )

  if (client && !apiParty.client)
    throw new Error('Client-side API requests are disabled. Set "client: true" in the module options to enable them.')

  const endpoint = (apiParty.endpoints || {})[endpointId]

  const _fetchOptions = reactive(fetchOptions)

  const _endpointFetchOptions: EndpointFetchOptions = reactive({
    path: _path,
    query,
    headers: computed(() => ({
      ...headersToObject(toValue(headers)),
      ...(endpoint.cookies && useRequestHeaders(['cookie'])),
    })),
    method,
    body,
  })

  const _asyncDataOptions: AsyncDataOptions<T> = {
    server,
    lazy,
    default: defaultFn,
    transform,
    pick,
    watch: watch === false
      ? []
      : [
          _endpointFetchOptions,
          ...(watch || []),
        ],
    immediate,
  }

  let controller: AbortController | undefined

  return useAsyncData<T, FetchError>(
    _key.value,
    async (nuxt) => {
      controller?.abort?.()

      // Workaround to persist response client-side
      // https://github.com/nuxt/nuxt/issues/15445
      if ((nuxt!.isHydrating || cache) && nuxt!.payload.data[_key.value])
        return nuxt!.payload.data[_key.value]

      controller = new AbortController()

      let result: T | undefined

      try {
        if (client) {
          result = (await globalThis.$fetch<T>(_path.value, {
            ..._fetchOptions,
            signal: controller.signal,
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
            body: _endpointFetchOptions.body,
          })) as T
        }
        else {
          result = (await globalThis.$fetch<T>(
            `/api/__api_party/${endpointId}`,
            {
              ..._fetchOptions,
              signal: controller.signal,
              method: 'POST',
              body: {
                ..._endpointFetchOptions,
                body: await serializeMaybeEncodedBody(_endpointFetchOptions.body),
              } satisfies EndpointFetchOptions,
            },
          )) as T
        }
      }
      catch (error) {
        // Invalidate cache if request fails
        nuxt!.payload.data[_key.value] = undefined

        throw error
      }

      if (cache)
        nuxt!.payload.data[_key.value] = result

      return result
    },
    _asyncDataOptions,
  ) as AsyncData<T | undefined, FetchError>
}
