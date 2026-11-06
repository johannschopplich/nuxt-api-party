import type { ApiClientFetchOptions } from '../composables/$api'
import { useNitroApp, useRuntimeConfig } from 'nitropack/runtime'
import { mergeFetchHooks } from '../hooks'
import { resolvePathParams } from '../openapi'
import { getEndpointHeaders, mergeHeaders } from '../utils'

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
    headers: mergeHeaders(getEndpointHeaders(endpoint), headers),
    redirect: 'manual',
  }) as Promise<T>
}
