import type { RouterMethod } from 'h3'
import type { NitroFetchOptions } from 'nitropack'

export type EndpointFetchOptions = NitroFetchOptions<string> & {
  path: string
  query?: Record<string, any>
  headers?: HeadersInit
  method?: Uppercase<RouterMethod> | RouterMethod
  body?: RequestInit['body'] | Record<string, any>
}
