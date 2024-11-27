import type { NitroFetchOptions } from 'nitropack'
import type { AsyncData, AsyncDataOptions, NuxtError } from 'nuxt/app'
import type { MaybeRef, MaybeRefOrGetter, MultiWatchSources } from 'vue'
import type { ModuleOptions } from '../../module'
import type { FetchResponseData, FetchResponseError, FilterMethods, ParamsOption, RequestBodyOption } from '../openapi'
import type { EndpointFetchOptions } from '../types'
import { useAsyncData, useRequestHeaders, useRuntimeConfig } from '#imports'
import { hash } from 'ohash'
import { joinURL } from 'ufo'
import { computed, reactive, toValue } from 'vue'
import { CACHE_KEY_PREFIX } from '../constants'
import { isFormData } from '../form-data'
import { resolvePathParams } from '../openapi'
import { headersToObject, serializeMaybeEncodedBody } from '../utils'

type ComputedOptions<T> = {
  // eslint-disable-next-line ts/no-unsafe-function-type
  [K in keyof T]: T[K] extends Function
    ? T[K]
    : T[K] extends Record<string, any>
      ? ComputedOptions<T[K]> | MaybeRef<T[K]>
      : MaybeRef<T[K]>;
}

type ComputedMethodOption<M, P> = 'get' extends keyof P ? ComputedOptions<{ method?: M }> : ComputedOptions<{ method: M }>

export type SharedAsyncDataOptions<ResT, DataT = ResT> = Omit<AsyncDataOptions<ResT, DataT>, 'watch'> & {
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
  watch?: MultiWatchSources | false
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
  | 'retryStatusCodes'
  | 'timeout'
> & {
  path?: MaybeRefOrGetter<Record<string, string>>
  body?: MaybeRef<string | Record<string, any> | FormData | null>
} & SharedAsyncDataOptions<T>

export type UseApiData = <T = unknown>(
  path: MaybeRefOrGetter<string>,
  opts?: UseApiDataOptions<T>,
) => AsyncData<T | null, NuxtError>

export type UseOpenAPIDataOptions<
  Method,
  LowercasedMethod,
  Params,
  ResT,
  DataT = ResT,
  Operation = 'get' extends LowercasedMethod ? ('get' extends keyof Params ? Params['get'] : never) : LowercasedMethod extends keyof Params ? Params[LowercasedMethod] : never,
> =
  ComputedMethodOption<Method, Params>
  & ComputedOptions<ParamsOption<Operation>>
  & ComputedOptions<RequestBodyOption<Operation>>
  & Omit<AsyncDataOptions<ResT, DataT>, 'query' | 'body' | 'method'>
  & Pick<NitroFetchOptions<string>, 'onRequest' | 'onRequestError' | 'onResponse' | 'onResponseError'>
  & SharedAsyncDataOptions<ResT, DataT>

export type UseOpenAPIData<Paths> = <
  ReqT extends Extract<keyof Paths, string>,
  Methods extends FilterMethods<Paths[ReqT]>,
  Method extends Extract<keyof Methods, string> | Uppercase<Extract<keyof Methods, string>>,
  LowercasedMethod extends Lowercase<Method> extends keyof Methods ? Lowercase<Method> : never,
  DefaultMethod extends 'get' extends LowercasedMethod ? 'get' : LowercasedMethod,
  ResT = Methods[DefaultMethod] extends Record<PropertyKey, any> ? FetchResponseData<Methods[DefaultMethod]> : never,
  ErrorT = Methods[DefaultMethod] extends Record<PropertyKey, any> ? FetchResponseError<Methods[DefaultMethod]> : never,
  DataT = ResT,
>(
  path: MaybeRefOrGetter<ReqT>,
  options?: UseOpenAPIDataOptions<Method, LowercasedMethod, Methods, ResT, DataT>,
  autoKey?: string
) => AsyncData<DataT | null, ErrorT>

export function _useApiData<T = unknown>(
  endpointId: string,
  path: MaybeRefOrGetter<string>,
  opts: UseApiDataOptions<T> = {},
) {
  const apiParty = useRuntimeConfig().public.apiParty as Required<ModuleOptions>
  const {
    server,
    lazy,
    default: defaultFn,
    transform,
    pick,
    watch,
    immediate,
    path: pathParams,
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

  return useAsyncData<T, unknown>(
    _key.value,
    async (nuxt) => {
      controller?.abort?.()

      if (nuxt && (nuxt.isHydrating || cache) && nuxt.payload.data[_key.value])
        return nuxt.payload.data[_key.value]

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
            joinURL('/api', apiParty.server.basePath!, endpointId),
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
        if (nuxt)
          nuxt.payload.data[_key.value] = undefined

        throw error
      }

      if (nuxt && cache)
        nuxt.payload.data[_key.value] = result

      return result
    },
    _asyncDataOptions,
  ) as AsyncData<T | null, NuxtError>
}
