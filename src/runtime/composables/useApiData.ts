import type { NitroFetchOptions } from 'nitropack'
import type { AsyncData, AsyncDataOptions, NuxtError } from 'nuxt/app'
import type { MaybeRef, MaybeRefOrGetter, MultiWatchSources } from 'vue'
import type { ModuleOptions } from '../../module'
import type { FetchResponseData, FetchResponseError, FilterMethods, ParamsOption, RequestBodyOption } from '../openapi'
import { useAsyncData, useRequestHeaders, useRuntimeConfig } from '#imports'
import { hash } from 'ohash'
import { computed, reactive, toValue } from 'vue'
import { CACHE_KEY_PREFIX } from '../constants'
import { isFormData } from '../form-data'
import { mergeHeaders } from '../utils'
import { _$api } from './$api'

type ComputedOptions<T> = {
  // eslint-disable-next-line ts/no-unsafe-function-type
  [K in keyof T]: T[K] extends Function
    ? T[K]
    : T[K] extends Record<string, any>
      ? ComputedOptions<T[K]> | MaybeRef<T[K]>
      : MaybeRef<T[K]>;
}

type ComputedMethodOption<M, P> = 'get' extends keyof P ? ComputedOptions<{ method?: M }> : ComputedOptions<{ method: M }>

// #region types
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
  | 'query'
  | 'headers'
  | 'method'
  | 'retry'
  | 'retryDelay'
  | 'retryStatusCodes'
  | 'timeout'
  | 'cache'
> & Pick<
  NitroFetchOptions<string>,
  | 'onRequest'
  | 'onRequestError'
  | 'onResponse'
  | 'onResponseError'
> & {
  path?: MaybeRefOrGetter<Record<string, string>>
  body?: MaybeRef<string | Record<string, any> | FormData | null>
} & SharedAsyncDataOptions<T>

export type UseApiData = <T = unknown>(
  path: MaybeRefOrGetter<string>,
  opts?: UseApiDataOptions<T>,
) => AsyncData<T | null, NuxtError>
// #endregion types

export type UseOpenAPIDataOptions<
  Method,
  LowercasedMethod,
  Params,
  ResT,
  DataT = ResT,
  Operation = 'get' extends LowercasedMethod ? ('get' extends keyof Params ? Params['get'] : never) : LowercasedMethod extends keyof Params ? Params[LowercasedMethod] : never,
> = ComputedMethodOption<Method, Params>
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
    key,
    ...fetchOptions
  } = opts

  const _key = computed(key === undefined
    ? () => CACHE_KEY_PREFIX + hash([
        endpointId,
        toValue(path),
        toValue(pathParams),
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

  const watchSources = reactive({
    path,
    pathParams,
    query,
    headers: computed(() => mergeHeaders(
      toValue(headers),
      endpoint.cookies ? useRequestHeaders(['cookie']) : undefined,
    )),
    method,
    body,
  })

  const _asyncDataOptions: AsyncDataOptions<T> = {
    server,
    lazy,
    default: defaultFn,
    transform,
    pick,
    watch: watch === false ? [] : [watchSources, ...(watch || [])],
    immediate,
  }

  let controller: AbortController | undefined

  return useAsyncData<T, unknown>(
    _key,
    async () => {
      controller?.abort?.()
      controller = new AbortController()

      return await _$api<T>(endpointId, toValue(path), {
        path: toValue(opts.path),
        method: toValue(opts.method),
        query: toValue(opts.query),
        headers: toValue(opts.headers),
        body: toValue(opts.body),
        client: toValue(opts.client),
        signal: controller.signal,
        ..._fetchOptions,
      })
    },
    _asyncDataOptions,
  ) as AsyncData<T | null, NuxtError>
}
