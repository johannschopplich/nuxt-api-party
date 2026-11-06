import type { NitroFetchOptions } from 'nitropack'
import type { $Fetch, ResponseType } from 'ofetch'
import type { FetchResponseData, MethodOption, ParamsOption, PathItem, RequestBodyOption } from '../openapi'
import { camelCase, pascalCase } from 'scule'
import { joinURL } from 'ufo'
import { proxyRoute } from '#build/module/nuxt-api-party.config'
import { useNuxtApp, useRequestFetch, useRuntimeConfig } from '#imports'
import { mergeFetchHooks } from '../hooks'
import { resolvePathParams } from '../openapi'
import { mergeHeaders } from '../utils'

let hasWarnedAboutHydration = false

// #region options
export type ApiClientFetchOptions
  = NitroFetchOptions<string>
    & {
      path?: Record<string, string>
    }

export type ApiClient = <T = unknown>(
  path: string,
  opts?: ApiClientFetchOptions,
) => Promise<T>
// #endregion options

export type OpenAPIClientFetchOptions<
  Method,
  LowercasedMethod,
  Params,
  Operation = 'get' extends LowercasedMethod ? ('get' extends keyof Params ? Params['get'] : never) : LowercasedMethod extends keyof Params ? Params[LowercasedMethod] : never,
> = MethodOption<Method, Params>
  & ParamsOption<Operation>
  & RequestBodyOption<Operation>
  & Omit<NitroFetchOptions<string>, 'query' | 'body' | 'method'>

export type OpenAPIClient<Paths> = <
  ReqT extends Extract<keyof Paths, string>,
  Methods extends PathItem<Paths[ReqT]>,
  Method extends Extract<keyof Methods, string> | Uppercase<Extract<keyof Methods, string>>,
  LowercasedMethod extends Lowercase<Method> extends keyof Methods ? Lowercase<Method> : never,
  DefaultMethod extends 'get' extends LowercasedMethod ? 'get' : LowercasedMethod,
  ResT = Methods[DefaultMethod] extends Record<PropertyKey, any> ? FetchResponseData<Methods[DefaultMethod]> : never,
>(
  path: ReqT,
  options?: OpenAPIClientFetchOptions<Method, LowercasedMethod, Methods>,
) => Promise<ResT>

export async function _$api<T = unknown>(
  endpointId: string,
  path: string,
  opts: ApiClientFetchOptions = {},
) {
  if (import.meta.dev && import.meta.client && !hasWarnedAboutHydration && useNuxtApp().isHydrating) {
    hasWarnedAboutHydration = true
    console.warn(`[nuxt-api-party] \`$${camelCase(endpointId)}\` sent a request during hydration that the server has already sent. To reuse the server's response, wrap the call in \`useAsyncData\` or use \`use${pascalCase(endpointId)}Data\`.`)
  }

  return createEndpointFetch(endpointId).$fetch<T>(path, opts)
}

/**
 * Creates the fetch for an endpoint's requests, which go through the server proxy or, for a client endpoint,
 * straight to the API, along with the base URL it sends them to.
 */
export function createEndpointFetch(endpointId: string) {
  const nuxt = useNuxtApp()
  const runtimeConfig = useRuntimeConfig()

  // Only a client endpoint is published.
  const clientEndpoint = runtimeConfig.public.apiParty.endpoints[endpointId]

  // A `baseURL` of its own replaces the `app.baseURL` that `$fetch` would prepend.
  const baseURL = clientEndpoint ? clientEndpoint.url : joinURL(runtimeConfig.app.baseURL, proxyRoute, endpointId)

  // `useRequestFetch` forwards the visitor's headers, cookie included, which only the server proxy may see.
  // Typed as plain ofetch: the endpoint's paths are not the app's routes that Nuxt's typed fetch checks against.
  const endpointFetch = (clientEndpoint ? globalThis.$fetch : useRequestFetch()) as $Fetch

  function $fetch<T = unknown>(path: string, opts: ApiClientFetchOptions = {}) {
    const { path: pathParams, query, headers, ...fetchOptions } = opts

    const fetchHooks = mergeFetchHooks(fetchOptions, {
      async onRequest(ctx) {
        await nuxt.callHook('api-party:request', ctx, endpointId)
      },
      async onResponse(ctx) {
        await nuxt.callHook('api-party:response', ctx, endpointId)
      },
    })

    // Headers travel as a plain object: during SSR, `useRequestFetch` spreads them into one, which empties a `Headers` instance.
    const targetOptions = clientEndpoint
      ? {
          query: { ...clientEndpoint.query, ...query },
          headers: Object.fromEntries(mergeHeaders(
            clientEndpoint.token ? { Authorization: `Bearer ${clientEndpoint.token}` } : undefined,
            clientEndpoint.headers,
            headers,
          )),
        }
      : {
          query,
          headers: {
            ...Object.fromEntries(mergeHeaders(headers)),
            // During SSR, `useRequestFetch` forwards the `Sec-Fetch-Site` of the visitor's navigation, which would
            // trip the server proxy's cross-site check, but this request comes from the app itself.
            ...(import.meta.server && { 'sec-fetch-site': 'same-origin' }),
          },
        }

    return endpointFetch<T, ResponseType>(resolvePathParams(path, pathParams), {
      ...fetchOptions,
      ...fetchHooks,
      ...targetOptions,
      baseURL,
    }) as Promise<T>
  }

  return { baseURL, $fetch }
}
