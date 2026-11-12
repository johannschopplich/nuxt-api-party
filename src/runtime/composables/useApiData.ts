import type { FetchResponseErrorData } from 'apiful/openapi'
import type { AsyncData, KeysOf, NuxtError, PickFrom, UseFetch, UseFetchOptions } from 'nuxt/app'
import type { FetchOptions } from 'ofetch'
import type { MaybeRefOrGetter } from 'vue'
import type { FetchResponseData, MethodOption, ParamsOption, PathItem, RequestBodyOption } from '../openapi'
import type { RequestMethod } from '../types'
import { resolvePathParams } from 'apiful/openapi'
import { toValue } from 'vue'

/** Copy of the type Nuxt maps its own fetch options through, which it does not export. */
type ComputedOptions<T extends Record<string, any>> = {
  // eslint-disable-next-line ts/no-unsafe-function-type
  [K in keyof T]: T[K] extends Function ? T[K] : ComputedOptions<T[K]> | MaybeRefOrGetter<T[K]>
}

/**
 * Nuxt's own `useFetch` options, less those that type the request against the app's server routes or that
 * the endpoint decides.
 */
type AsyncDataFetchOptions<ResT, DataT, PickKeys extends KeysOf<DataT>, DefaultT> = Omit<
  UseFetchOptions<ResT, DataT, PickKeys, DefaultT>,
  'baseURL' | '$fetch' | 'method' | 'query' | 'params' | 'body' | 'headers'
>

// #region options
export type UseApiDataOptions<
  ResT,
  DataT = ResT,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = undefined,
> = AsyncDataFetchOptions<ResT, DataT, PickKeys, DefaultT>
  & ComputedOptions<{
    method?: RequestMethod
    path?: Record<string, string>
    query?: FetchOptions['query']
    headers?: FetchOptions['headers']
    body?: FetchOptions['body']
  }>

export type UseApiData = <
  ResT = unknown,
  ErrorT = unknown,
  DataT = ResT,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = undefined,
>(
  path: MaybeRefOrGetter<string>,
  opts?: UseApiDataOptions<ResT, DataT, PickKeys, DefaultT>,
  autoKey?: string,
) => AsyncData<PickFrom<DataT, PickKeys> | DefaultT, NuxtError<ErrorT> | undefined>
// #endregion options

export type UseOpenAPIDataOptions<
  Method,
  LowercasedMethod,
  Params,
  ResT,
  DataT = ResT,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = undefined,
  Operation = 'get' extends LowercasedMethod ? ('get' extends keyof Params ? Params['get'] : never) : LowercasedMethod extends keyof Params ? Params[LowercasedMethod] : never,
> = AsyncDataFetchOptions<ResT, DataT, PickKeys, DefaultT>
  & ComputedOptions<MethodOption<Method, Params>>
  & ComputedOptions<ParamsOption<Operation>>
  & ComputedOptions<RequestBodyOption<Operation>>

export type UseOpenAPIData<Paths> = <
  ReqT extends Extract<keyof Paths, string>,
  Methods extends PathItem<Paths[ReqT]>,
  Method extends Extract<keyof Methods, string> | Uppercase<Extract<keyof Methods, string>>,
  LowercasedMethod extends Lowercase<Method> extends keyof Methods ? Lowercase<Method> : never,
  DefaultMethod extends 'get' extends LowercasedMethod ? 'get' : LowercasedMethod,
  ResT = Methods[DefaultMethod] extends Record<PropertyKey, any> ? FetchResponseData<Methods[DefaultMethod]> : never,
  ErrorT = Methods[DefaultMethod] extends Record<PropertyKey, any> ? FetchResponseErrorData<Methods[DefaultMethod]> : never,
  DataT = ResT,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = undefined,
>(
  path: MaybeRefOrGetter<ReqT>,
  options?: UseOpenAPIDataOptions<Method, LowercasedMethod, Methods, ResT, DataT, PickKeys, DefaultT>,
  autoKey?: string,
) => AsyncData<PickFrom<DataT, PickKeys> | DefaultT, NuxtError<ErrorT> | undefined>

export function _useApiData(
  useFetch: UseFetch,
  path: MaybeRefOrGetter<string>,
  arg1?: UseApiDataOptions<unknown> | string,
  arg2?: string,
) {
  const [opts = {}, autoKey] = typeof arg1 === 'string' ? [{}, arg1] : [arg1, arg2]
  const { path: pathParams, ...fetchOptions } = opts

  const getPathParams = () => Object.fromEntries(
    Object.entries(toValue(pathParams) ?? {}).map(([name, value]) => [name, toValue(value)]),
  )

  // Resolved into the request, so each value of the path parameters gets a key of its own. A value that
  // cannot be resolved is left to the endpoint's fetch, whose error lands in `error` rather than in `setup`.
  const request = () => {
    try {
      return resolvePathParams(toValue(path), getPathParams())
    }
    catch {
      return toValue(path)
    }
  }

  // Passed on as a getter, which Nuxt neither unwraps nor watches, so only a changed key fetches again.
  return useFetch(request, { ...fetchOptions, path: getPathParams } as UseFetchOptions<unknown>, autoKey)
}
