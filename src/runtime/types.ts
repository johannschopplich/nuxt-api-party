import type { RouterMethod } from 'h3'

export type RequestMethod = Uppercase<RouterMethod> | RouterMethod

export interface AllowedRoute {
  /** Pathname below the endpoint URL, where `*` matches one segment and a trailing `**` any number of them. */
  path: string
  /** Methods the route accepts; all of them when omitted. */
  methods?: RequestMethod[]
}
