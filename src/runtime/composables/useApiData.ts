import { computed, reactive } from 'vue'
import { hash } from 'ohash'
import type { FetchError } from 'ofetch'
import type { NitroFetchOptions } from 'nitropack'
import type { WatchSource } from 'vue'
import type { AsyncData, AsyncDataOptions } from 'nuxt/app'
import type { ModuleOptions } from '../../module'
import { headersToObject, resolvePath, serializeMaybeEncodedBody, toValue } from '../utils'
import { isFormData } from '../formData'
import type { EndpointFetchOptions, MaybeRef, MaybeRefOrGetter } from '../utils'
import type { AllPaths, GETPaths, GETPlainPaths, HttpMethod, IgnoreCase, OpenApiError, OpenApiRequestOptions, OpenApiResponse, PathItemObject } from '../types'
import { useAsyncData, useRequestHeaders, useRuntimeConfig } from '#imports'

type ComputedOptions<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? T[K]
    : T[K] extends Record<string, any>
      ? ComputedOptions<T[K]> | MaybeRef<T[K]>
      : MaybeRef<T[K]>;
}

export type BaseUseApiDataOptions<T> = Omit<AsyncDataOptions<T>, 'watch'> & {
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
  /**
   * Watch an array of reactive sources and auto-refresh the fetch result when they change.
   * Fetch options and URL are watched by default. You can completely ignore reactive sources by using `watch: false`.
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
  body?: MaybeRef<string | Record<string, any> | FormData | null | undefined>
} & BaseUseApiDataOptions<T>

export type UseOpenApiDataOptions<
  P extends PathItemObject,
  M extends IgnoreCase<keyof P & HttpMethod> = IgnoreCase<keyof P & 'get'>,
> = BaseUseApiDataOptions<OpenApiResponse<P[Lowercase<M>]>> & ComputedOptions<OpenApiRequestOptions<P, M>>

export type UseApiData = <T = any>(
  path: MaybeRefOrGetter<string>,
  opts?: UseApiDataOptions<T>,
) => AsyncData<T | undefined, FetchError>

export interface UseOpenApiData<Paths extends Record<string, PathItemObject>> {
  <P extends GETPlainPaths<Paths>>(
    path: MaybeRefOrGetter<P>,
    opts?: Omit<UseOpenApiDataOptions<Paths[`/${P}`]>, 'method'>,
  ): AsyncData<OpenApiResponse<Paths[`/${P}`]['get']> | undefined, FetchError<OpenApiError<Paths[`/${P}`]['get']>>>
  <P extends GETPaths<Paths>>(
    path: MaybeRefOrGetter<P>,
    opts: Omit<UseOpenApiDataOptions<Paths[`/${P}`]>, 'method'>,
  ): AsyncData<OpenApiResponse<Paths[`/${P}`]['get']> | undefined, FetchError<OpenApiError<Paths[`/${P}`]['get']>>>
<P extends AllPaths<Paths>, M extends IgnoreCase<keyof Paths[`/${P}`] & HttpMethod>>(
    path: MaybeRefOrGetter<P>,
    opts: UseOpenApiDataOptions<Paths[`/${P}`], M> & { method: M },
  ): AsyncData<OpenApiResponse<Paths[`/${P}`][Lowercase<M>]> | undefined, FetchError<OpenApiError<Paths[`/${P}`][Lowercase<M>]>>>
}

export function _useApiData<T = any>(
  endpointId: string,
  path: MaybeRefOrGetter<string>,
  opts: UseApiDataOptions<T> = {},
) {
  const { apiParty } = useRuntimeConfig().public
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
    client = false,
    cache = true,
    ...fetchOptions
  } = opts
  const _path = computed(() => resolvePath(toValue(path), toValue(pathParams)))

  if (client && !apiParty.allowClient)
    throw new Error('Client-side API requests are disabled. Set "allowClient: true" in the module options to enable them.')

  const endpoints = (apiParty as unknown as ModuleOptions).endpoints || {}
  const endpoint = endpoints[endpointId]

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
  const key = computed(() => `$party${hash([
    endpointId,
    _path.value,
    toValue(query),
    toValue(method),
    ...(isFormData(toValue(body)) ? [] : [toValue(body)]),
  ])}`)

  return useAsyncData<T, FetchError>(
    key.value,
    async (nuxt) => {
      controller?.abort?.()

      // Workaround to persist response client-side
      // https://github.com/nuxt/nuxt/issues/15445
      if ((nuxt!.isHydrating || cache) && key.value in nuxt!.payload.data)
        return nuxt!.payload.data[key.value]

      controller = new AbortController()

      let result: T | undefined

      try {
        if (client) {
          result = (await globalThis.$fetch<T>(_path.value, {
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
        if (key.value in nuxt!.payload.data)
          delete nuxt!.payload.data[key.value]

        throw error
      }

      if (cache)
        nuxt!.payload.data[key.value] = result

      return result
    },
    _asyncDataOptions,
  ) as AsyncData<T | undefined, FetchError>
}
