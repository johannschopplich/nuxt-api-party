import type { NitroFetchOptions } from 'nitropack'
import type { RouterMethod } from 'h3'

export type EndpointFetchOptions = NitroFetchOptions<string> & {
  path: string
  query?: Record<string, any>
  headers?: HeadersInit
  method?: Uppercase<RouterMethod> | RouterMethod
  body?: RequestInit['body'] | Record<string, any>
}
