import type { NitroFetchOptions } from 'nitropack'
import type { ModuleOptions } from '../../module'
import type { FetchResponseData, FilterMethods, MethodOption, ParamsOption, RequestBodyOption } from '../openapi'
import { useNuxtApp, useRequestFetch, useRuntimeConfig } from '#imports'
import { joinURL } from 'ufo'
import { mergeFetchHooks } from '../hooks'
import { resolvePathParams } from '../openapi'
import { mergeHeaders } from '../utils'

// #region types
export interface SharedFetchOptions {
  /**
   * Skip the Nuxt server proxy and fetch directly from the API.
   * Requires `client` set to `true` in the module options.
   * @remarks
   * If Nuxt SSR is disabled, client-side requests are enabled by default.
   * @default false
   */
  client?: boolean
  /**
   * The browser cache behavior.
   *
   * It accepts the same values as {@linkcode RequestInit.cache}. For backwards
   * compatibility, you can also use `true` for `'default'` and `false` for
   * `'no-store'`.
   *
   * @remarks
   * This option is forwarded to the `fetch` API as the `cache` option.
   *
   * @default 'default'
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Request/cache
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching
   */
  cache?: RequestInit['cache'] | boolean
}

export type ApiClientFetchOptions
  = Omit<NitroFetchOptions<string>, 'body' | 'cache'>
    & {
      path?: Record<string, string>
      body?: string | Record<string, any> | FormData | null
    }

export type ApiClient = <T = unknown>(
  path: string,
  opts?: ApiClientFetchOptions & SharedFetchOptions,
) => Promise<T>
// #endregion types

export type OpenAPIClientFetchOptions<
  Method,
  LowercasedMethod,
  Params,
  Operation = 'get' extends LowercasedMethod ? ('get' extends keyof Params ? Params['get'] : never) : LowercasedMethod extends keyof Params ? Params[LowercasedMethod] : never,
> = MethodOption<Method, Params>
  & ParamsOption<Operation>
  & RequestBodyOption<Operation>
  & Omit<NitroFetchOptions<string>, 'query' | 'body' | 'method' | 'cache'>
  & SharedFetchOptions

export type OpenAPIClient<Paths> = <
  ReqT extends Extract<keyof Paths, string>,
  Methods extends FilterMethods<Paths[ReqT]>,
  Method extends Extract<keyof Methods, string> | Uppercase<Extract<keyof Methods, string>>,
  LowercasedMethod extends Lowercase<Method> extends keyof Methods ? Lowercase<Method> : never,
  DefaultMethod extends 'get' extends LowercasedMethod ? 'get' : LowercasedMethod,
  ResT = Methods[DefaultMethod] extends Record<PropertyKey, any> ? FetchResponseData<Methods[DefaultMethod]> : never,
>(
  path: ReqT,
  options?: OpenAPIClientFetchOptions<Method, LowercasedMethod, Methods>
) => Promise<ResT>

export async function _$api<T = unknown>(
  endpointId: string,
  path: string,
  opts: ApiClientFetchOptions & SharedFetchOptions = {},
) {
  const nuxt = useNuxtApp()
  const apiParty = useRuntimeConfig().public.apiParty as Required<ModuleOptions>

  let {
    path: pathParams,
    query,
    headers,
    method,
    body,
    client = apiParty.client === 'always',
    cache,
    ...fetchOptions
  } = opts

  if (typeof cache === 'boolean') {
    cache = cache ? 'default' : 'no-store'
  }

  if (client && !apiParty.client)
    throw new Error('Client-side API requests are disabled. Set "client: true" in the module options to enable them.')

  const endpoint = (apiParty.endpoints || {})[endpointId]

  const fetchHooks = mergeFetchHooks(fetchOptions, {
    async onRequest(ctx) {
      await nuxt.callHook('api-party:request', ctx)
      // @ts-expect-error: Types will be generated on Nuxt prepare
      await nuxt.callHook(`api-party:request:${endpointId}`, ctx)
    },
    async onResponse(ctx) {
      // @ts-expect-error: Types will be generated on Nuxt prepare
      await nuxt.callHook(`api-party:response:${endpointId}`, ctx)
      await nuxt.callHook('api-party:response', ctx)
    },
  })

  return await useRequestFetch()<T>(resolvePathParams(path, pathParams), {
    ...fetchOptions,
    ...fetchHooks,
    baseURL: client ? endpoint.url : joinURL('/api', apiParty.server.basePath!, endpointId, 'proxy'),
    method,
    query: {
      ...endpoint.query,
      ...query,
    },
    headers: mergeHeaders(
      endpoint.token ? { Authorization: `Bearer ${endpoint.token}` } : undefined,
      endpoint.headers,
      headers,
    ),
    body,
    cache,
  })
}
