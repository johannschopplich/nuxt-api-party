import type { NitroFetchOptions } from 'nitropack'

type HTTPMethod = 'GET' | 'HEAD' | 'PATCH' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE'

export type EndpointFetchOptions = NitroFetchOptions<string> & {
  path: string
  query?: Record<string, any>
  headers?: HeadersInit
  method?: Lowercase<HTTPMethod> | Uppercase<HTTPMethod>
  body?: RequestInit['body'] | Record<string, any>
}
