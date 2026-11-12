import type { H3Event } from 'h3'
import type { NitroFetchOptions } from 'nitropack'
import type { $Fetch, ResponseType } from 'ofetch'
import type { MaybeRefOrGetter } from 'vue'
import type { FetchResponseData, MethodOption, ParamsOption, PathItem, RequestBodyOption } from '../openapi'
import { resolvePathParams } from 'apiful/openapi'
import { getRequestIP } from 'h3'
import { camelCase, pascalCase } from 'scule'
import { joinURL } from 'ufo'
import { toValue } from 'vue'
import { proxyRoute } from '#build/module/nuxt-api-party.config'
import { useNuxtApp, useRequestEvent, useRequestHeaders, useRuntimeConfig } from '#imports'
import { mergeFetchHooks } from '../hooks'
import { getEndpointHeaders, mergeHeaders } from '../utils'

let hasWarnedAboutHydration = false

/**
 * Headers of the page request that describe the visitor rather than the page, which a request from the browser
 * would carry as well.
 */
const VISITOR_HEADERS = ['cookie', 'authorization', 'accept-language', 'user-agent']

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

  const clientEndpoint = runtimeConfig.public.apiParty.endpoints[endpointId]

  const baseURL = clientEndpoint ? clientEndpoint.url : joinURL(runtimeConfig.app.baseURL, proxyRoute, endpointId)

  // Typed as plain ofetch: the endpoint's paths are not the app's routes that Nuxt's typed fetch checks against.
  const endpointFetch = globalThis.$fetch as $Fetch
  // During SSR, the server proxy sees the visitor's headers, cookie included, which a client endpoint must not.
  const requestEvent = import.meta.server && !clientEndpoint ? useRequestEvent() : undefined
  const visitorHeaders = requestEvent ? getVisitorHeaders(requestEvent) : {}

  function $fetch<T = unknown>(
    path: string,
    // `useMyApiData` hands its path parameters over as a getter.
    opts: Omit<ApiClientFetchOptions, 'path'> & { path?: MaybeRefOrGetter<Record<string, string>> } = {},
  ) {
    const { path: pathParams, query, headers, ...fetchOptions } = opts

    const fetchHooks = mergeFetchHooks(fetchOptions, {
      async onRequest(ctx) {
        await nuxt.callHook('api-party:request', ctx, endpointId)
      },
      async onResponse(ctx) {
        await nuxt.callHook('api-party:response', ctx, endpointId)
      },
    })

    const targetOptions = clientEndpoint
      ? {
          query: { ...clientEndpoint.query, ...query },
          headers: mergeHeaders(getEndpointHeaders(clientEndpoint), headers),
        }
      : {
          query,
          headers: mergeHeaders(visitorHeaders, headers),
          // Hands the proxy the page request's platform bindings, such as `event.context.cloudflare`, as `useRequestFetch` does.
          ...(requestEvent && { context: requestEvent.context }),
        }

    // Joined here rather than by `$fetch`, which sends a path that names a scheme to the host it names.
    return endpointFetch<T, ResponseType>(joinURL(baseURL, resolvePathParams(path, toValue(pathParams))), {
      ...fetchOptions,
      ...fetchHooks,
      ...targetOptions,
      // Without it, `$fetch` would prepend `app.baseURL`.
      baseURL: '',
    }) as Promise<T>
  }

  return { baseURL, $fetch }
}

/**
 * Collects the page request's `VISITOR_HEADERS` and the visitor's address. Unlike `useRequestFetch`, it leaves out
 * the page request's own headers, such as `If-None-Match`, to which the API could answer with a body-less `304`.
 */
function getVisitorHeaders(event: H3Event) {
  // Only the headers the page request carries come back, so none is `undefined`.
  const headers = useRequestHeaders(VISITOR_HEADERS) as Record<string, string>

  const clientAddress = getRequestIP(event, { xForwardedFor: true })
  if (clientAddress)
    headers['x-forwarded-for'] = clientAddress

  return headers
}
