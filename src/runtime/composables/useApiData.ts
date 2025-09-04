import type { NitroFetchOptions } from 'nitropack'
import type { AsyncData, AsyncDataOptions, NuxtError } from 'nuxt/app'
import type { MaybeRef, MaybeRefOrGetter, MultiWatchSources } from 'vue'
import type { FetchResponseData, FetchResponseError, FilterMethods, ParamsOption, RequestBodyOption } from '../openapi'
import type { SharedFetchOptions } from './$api'
import { allowClient, experimentalDisableClientPayloadCache } from '#build/module/nuxt-api-party.config'
import { useFetch } from '#imports'
import { hash } from 'ohash'
import { computed, toValue } from 'vue'
import { CACHE_KEY_PREFIX } from '../constants'
import { isFormData } from '../form-data'
import { resolvePathParams } from '../openapi'
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

// #region options
export type SharedAsyncDataOptions<ResT, DataT = ResT> = ComputedOptions<SharedFetchOptions> & Omit<AsyncDataOptions<ResT, DataT>, 'watch'> & {
  /**
   * The key passed to `useAsyncData`. By default, will be generated from the request options.
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
  autoKey?: string
) => AsyncData<T | undefined, NuxtError>
// #endregion options

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
) => AsyncData<DataT | undefined, NuxtError<ErrorT>>

export function _useApiData<T = unknown>(
  endpointId: string,
  path: MaybeRefOrGetter<string>,
  arg1?: UseApiDataOptions<T> | string,
  arg2?: string,
) {
  const [opts = {}, autoKey] = typeof arg1 === 'string' ? [{}, arg1] : [arg1, arg2]

  if (!experimentalDisableClientPayloadCache) {
    opts.cache ??= true
  }

  const {
    path: pathParams,
    client = allowClient === 'always',
    cache,
    ...fetchOptions
  } = opts

  const _path = computed(() => resolvePathParams(toValue(path), toValue(pathParams)))
  const _key = computed(() => toValue(opts.key) || (CACHE_KEY_PREFIX + hash([
    autoKey,
    endpointId,
    _path.value,
    toValue(opts.query),
    toValue(opts.method),
    ...(isFormData(toValue(opts.body)) ? [] : [toValue(opts.body)]),
  ])))

  if (toValue(client) && !allowClient)
    throw new Error('Client-side API requests are disabled. Set "client: true" in the module options to enable them.')

  return useFetch(_path, {
    ...fetchOptions,
    key: _key,
    $fetch: ((request: string, opts) => _$api(endpointId, request, {
      ...opts,
      cache: toValue(cache),
      client: toValue(client),
      key: _key.value,
    })) as typeof globalThis.$fetch,
  }) as AsyncData<T | undefined, NuxtError>
}
