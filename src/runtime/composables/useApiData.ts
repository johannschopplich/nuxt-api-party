import type { NitroFetchOptions } from 'nitropack'
import type { AsyncData, AsyncDataOptions, NuxtError, UseFetch, UseFetchOptions } from 'nuxt/app'
import type { MaybeRef, MaybeRefOrGetter, MultiWatchSources } from 'vue'
import type { FetchResponseData, FetchResponseError, ParamsOption, PathItem, RequestBodyOption } from '../openapi'
import { toValue } from 'vue'
import { resolvePathParams } from '../openapi'

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
export type SharedAsyncDataOptions<ResT, DataT = ResT> = ComputedOptions<Pick<NitroFetchOptions<string>, 'cache'>> & Omit<AsyncDataOptions<ResT, DataT>, 'watch'> & {
  /**
   * The key passed to `useAsyncData`. By default, will be generated from the request options.
   */
  key?: MaybeRefOrGetter<string>
  /**
   * Watch an array of reactive sources and auto-refresh the fetch result when they change.
   * Fetch options and URL are watched by default. You can completely ignore reactive sources by using `watch: false`.
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
  autoKey?: string,
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
  Methods extends PathItem<Paths[ReqT]>,
  Method extends Extract<keyof Methods, string> | Uppercase<Extract<keyof Methods, string>>,
  LowercasedMethod extends Lowercase<Method> extends keyof Methods ? Lowercase<Method> : never,
  DefaultMethod extends 'get' extends LowercasedMethod ? 'get' : LowercasedMethod,
  ResT = Methods[DefaultMethod] extends Record<PropertyKey, any> ? FetchResponseData<Methods[DefaultMethod]> : never,
  ErrorT = Methods[DefaultMethod] extends Record<PropertyKey, any> ? FetchResponseError<Methods[DefaultMethod]> : never,
  DataT = ResT,
>(
  path: MaybeRefOrGetter<ReqT>,
  options?: UseOpenAPIDataOptions<Method, LowercasedMethod, Methods, ResT, DataT>,
  autoKey?: string,
) => AsyncData<DataT | undefined, NuxtError<ErrorT>>

export function _useApiData<T = unknown>(
  useFetch: UseFetch,
  path: MaybeRefOrGetter<string>,
  arg1?: UseApiDataOptions<T> | string,
  arg2?: string,
) {
  const [opts = {}, autoKey] = typeof arg1 === 'string' ? [{}, arg1] : [arg1, arg2]
  const { path: pathParams, ...fetchOptions } = opts

  // Resolved into the request, so each value of the path parameters gets a key of its own.
  const request = () => resolvePathParams(toValue(path), toValue(pathParams))

  return useFetch(request, fetchOptions as UseFetchOptions<T>, autoKey) as AsyncData<T | undefined, NuxtError>
}
