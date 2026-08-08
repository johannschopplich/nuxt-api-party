import type { ApiClientFetchOptions, OpenAPIClient } from '../composables/$api'
import { useRuntimeConfig } from 'nitropack/runtime'
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
  const apiParty = useRuntimeConfig().apiParty
  const endpoint = apiParty.endpoints[endpointId]!

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
