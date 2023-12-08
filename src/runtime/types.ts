import type { NitroFetchOptions } from 'nitropack'
import type { Ref } from 'vue'

type HTTPMethod = 'GET' | 'HEAD' | 'PATCH' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE'

export type EndpointFetchOptions = NitroFetchOptions<string> & {
  path: string
  query?: Record<string, any>
  headers?: HeadersInit
  method?: Lowercase<HTTPMethod> | Uppercase<HTTPMethod>
  body?: RequestInit['body'] | Record<string, any>
}

export type MaybeRef<T> = T | Ref<T>
export type MaybeRefOrGetter<T> = MaybeRef<T> | (() => T)
