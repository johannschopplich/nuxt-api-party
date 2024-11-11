import { headersToObject } from '../utils'
import { resolvePathParams } from '../openapi'
import type { ModuleOptions } from '../../module'
import type { ApiClientFetchOptions } from '../composables/$api'
import { mergeFetchHooks } from '../hooks'
import { useNitroApp, useRuntimeConfig } from '#imports'

export function _$api<T = unknown>(
  endpointId: string,
  path: string,
  opts: ApiClientFetchOptions = {},
): Promise<T> {
  const { path: pathParams, query, headers, ...fetchOptions } = opts
  const apiParty = useRuntimeConfig().apiParty as Required<ModuleOptions>
  const endpoints = apiParty.endpoints || {}
  const endpoint = endpoints[endpointId]

  const nitro = useNitroApp()

  return globalThis.$fetch<T>(resolvePathParams(path, pathParams), {
    ...fetchOptions,
    ...mergeFetchHooks(fetchOptions, {
      onRequest: async (ctx) => {
        await nitro.hooks.callHook('api-party:request', ctx)
      },
      onResponse: async (ctx) => {
        await nitro.hooks.callHook('api-party:response', ctx)
      },
    }),
    baseURL: endpoint.url,
    query: {
      ...endpoint.query,
      ...query,
    },
    headers: {
      ...(endpoint.token && { Authorization: `Bearer ${endpoint.token}` }),
      ...endpoint.headers,
      ...headersToObject(headers),
    },
  }) as Promise<T>
}
