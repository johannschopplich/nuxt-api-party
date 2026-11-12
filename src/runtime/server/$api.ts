import type { ApiClientFetchOptions } from '../composables/$api'
import { resolvePathParams } from 'apiful/openapi'
import { useNitroApp, useRuntimeConfig } from 'nitropack/runtime'
import { joinURL } from 'ufo'
import { mergeFetchHooks } from '../hooks'
import { getEndpointHeaders, mergeHeaders } from '../utils'

export async function _$api<T = unknown>(
  endpointId: string,
  path: string,
  opts: ApiClientFetchOptions = {},
): Promise<T> {
  const { path: pathParams, query, headers, ...fetchOptions } = opts
  const nitro = useNitroApp()
  const endpoint = useRuntimeConfig().apiParty.endpoints[endpointId]!

  // Joined here rather than by `$fetch`, which sends a path that names a scheme to the host it names.
  return globalThis.$fetch<T>(joinURL(endpoint.url, resolvePathParams(path, pathParams)), {
    ...fetchOptions,
    ...mergeFetchHooks(fetchOptions, {
      async onRequest(ctx) {
        await nitro.hooks.callHook('api-party:request', ctx, undefined, endpointId)
      },
      async onResponse(ctx) {
        await nitro.hooks.callHook('api-party:response', ctx, undefined, endpointId)
      },
    }),
    // Without it, `$fetch` would prepend `app.baseURL`.
    baseURL: '',
    query: {
      ...endpoint.query,
      ...query,
    },
    headers: mergeHeaders(getEndpointHeaders(endpoint), headers),
    redirect: 'manual',
  }) as Promise<T>
}
