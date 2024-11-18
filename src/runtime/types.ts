import type { RouterMethod } from 'h3'
import type { NitroFetchOptions } from 'nitropack'

export type EndpointFetchOptions = NitroFetchOptions<string> & {
  path: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query?: Record<string, any>
  headers?: HeadersInit
  method?: Uppercase<RouterMethod> | RouterMethod
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: RequestInit['body'] | Record<string, any>
}
