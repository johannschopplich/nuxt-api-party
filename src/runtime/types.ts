import type { RouterMethod } from 'h3'
import type { NitroFetchOptions } from 'nitropack'

export type RequestMethod = Uppercase<RouterMethod> | RouterMethod

export type EndpointFetchOptions = NitroFetchOptions<string> & {
  path: string
  query?: Record<string, any>
  headers?: HeadersInit
  method?: RequestMethod
  body?: RequestInit['body'] | Record<string, any>
}

export interface AllowedRoute {
  /** Pathname below the endpoint URL, where `*` matches one segment and a trailing `**` any number of them. */
  path: string
  /** Methods the route accepts; all of them when omitted. */
  methods?: RequestMethod[]
}
