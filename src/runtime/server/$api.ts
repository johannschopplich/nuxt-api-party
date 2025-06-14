import type { ModuleOptions } from '../../module'
import type { ApiClientFetchOptions } from '../composables/$api'
import { useRuntimeConfig } from 'nitropack/runtime'
import { resolvePathParams } from '../openapi'
import { mergeHeaders } from '../utils'

export function _$api<T = unknown>(
  endpointId: string,
  path: string,
  opts: ApiClientFetchOptions = {},
): Promise<T> {
  const { path: pathParams, query, headers, ...fetchOptions } = opts
  const apiParty = useRuntimeConfig().apiParty as Required<ModuleOptions>
  const endpoints = apiParty.endpoints || {}
  const endpoint = endpoints[endpointId]

  return globalThis.$fetch<T>(resolvePathParams(path, pathParams), {
    ...fetchOptions,
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
  }) as Promise<T>
}
