import type { ApiClientFetchOptions, OpenAPIClient } from '../composables/$api'
import { useNitroApp, useRuntimeConfig } from 'nitropack/runtime'
import { mergeFetchHooks } from '../hooks'
import { resolvePathParams } from '../openapi'
import { mergeHeaders } from '../utils'

export type ServerApiClient = <T = unknown>(
  path: string,
  opts?: ApiClientFetchOptions,
) => Promise<T>

export type ServerOpenAPIClient<Paths> = OpenAPIClient<Paths, unknown>

export function _$api<T = unknown>(
  endpointId: string,
  path: string,
  opts: ApiClientFetchOptions = {},
): Promise<T> {
  const { path: pathParams, query, headers, ...fetchOptions } = opts
  const nitro = useNitroApp()
  const endpoint = useRuntimeConfig().apiParty.endpoints[endpointId]!

  return globalThis.$fetch<T>(resolvePathParams(path, pathParams), {
    ...fetchOptions,
    ...mergeFetchHooks(fetchOptions, {
      async onRequest(ctx) {
        await nitro.hooks.callHook('api-party:request', ctx, undefined, endpointId)
      },
      async onResponse(ctx) {
        await nitro.hooks.callHook('api-party:response', ctx, undefined, endpointId)
      },
    }),
    baseURL: endpoint.url,
    query: {
      ...endpoint.query,
      ...query,
    },
    headers: mergeHeaders(
      endpoint.token ? { Authorization: `Bearer ${endpoint.token}` } : undefined,
      endpoint.headers,
      headers,
    ),
    // Following a redirect would carry the endpoint credentials to wherever the API points.
    redirect: 'manual',
  }) as Promise<T>
}
