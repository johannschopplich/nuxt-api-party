import type { NitroFetchOptions } from 'nitropack'
import type { AsyncData, AsyncDataOptions, NuxtError } from 'nuxt/app'
import type { MaybeRef, MaybeRefOrGetter, MultiWatchSources } from 'vue'
import type { FetchResponseData, FetchResponseError, FilterMethods, ParamsOption, RequestBodyOption } from '../openapi'
import type { SharedFetchOptions } from './$api'
import { hash } from 'ohash'
import { computed, toValue } from 'vue'
import { allowClient, allowPayloadCache } from '#build/module/nuxt-api-party.config'
import { useFetch, useNuxtApp } from '#imports'
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
export type SharedAsyncDataOptions<ResT, DataT = ResT> = ComputedOptions<Omit<SharedFetchOptions, 'payloadCache'>> & Omit<AsyncDataOptions<ResT, DataT>, 'watch'> & {
  /**
   * Serve a repeated request from the Nuxt payload instead of sending it again.
   *
   * @remarks
   * Set this to opt a single call out. To turn payload caching off for the whole app, use the module option of
   * the same name, which is what this follows.
   *
   * @default the `payloadCache` module option
   */
  payloadCache?: MaybeRef<boolean>
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
  autoKey?: string,
) => AsyncData<DataT | undefined, NuxtError<ErrorT>>

export function _useApiData<T = unknown>(
  endpointId: string,
  path: MaybeRefOrGetter<string>,
  arg1?: UseApiDataOptions<T> | string,
  arg2?: string,
) {
  const [opts = {}, autoKey] = typeof arg1 === 'string' ? [{}, arg1] : [arg1, arg2]

  const {
    path: pathParams,
    client = allowClient === 'always',
    payloadCache = allowPayloadCache,
    $fetch,
    ...fetchOptions
  } = opts

  const _path = computed(() => resolvePathParams(toValue(path), toValue(pathParams)))

  // Identity of the request, so concurrent calls for the same resource resolve from a single fetch.
  const _requestKey = computed(() => CACHE_KEY_PREFIX + hash([
    endpointId,
    _path.value,
    toValue(opts.query),
    toValue(opts.method),
    ...(isFormData(toValue(opts.body)) ? [] : [toValue(opts.body)]),
  ]))

  // An explicit `key` merges two call sites back into one async data instance, as with Nuxt's own composables.
  const _asyncDataKey = computed(() => toValue(opts.key) || (autoKey ? `${_requestKey.value}${autoKey}` : _requestKey.value))

  if (toValue(client) && !allowClient)
    throw new Error('Client-side API requests are disabled. Set "client: true" in the module options to enable them.')

  const nuxt = useNuxtApp()

  // Nuxt hands an SSR response to the client under its own key, so an entry there means this call
  // site starts out with a result already.
  let hasResult = _asyncDataKey.value in nuxt.payload.data

  return useFetch(_path, {
    ...fetchOptions,
    key: _asyncDataKey,
    $fetch: ((request: string, opts) => {
      // Every fetch past the first one replaces a result this call site already has. The request
      // cache is invisible to Nuxt, so without this it would hand back the very response that a
      // refresh, a watched source or a changed key asked to replace.
      if (hasResult)
        delete nuxt.payload.data[_requestKey.value]

      hasResult = true

      return _$api(endpointId, request, {
        ...opts,
        $fetch: toValue($fetch),
        payloadCache: toValue(payloadCache),
        client: toValue(client),
        key: _requestKey.value,
      })
    }) as typeof globalThis.$fetch,
  }) as AsyncData<T | undefined, NuxtError>
}
