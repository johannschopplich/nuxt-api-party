import { unref } from 'vue'
import type { QueryObject } from 'ufo'
import type { ComputedRef, Ref } from 'vue'

export interface EndpointFetchOptions {
  query?: QueryObject
  method?: string
  body?: Record<string, any>
  headers?: Record<string, string>
}

export type MaybeComputedRef<T> = (() => T) | ComputedRef<T> | Ref<T> | T

export function resolveUnref<T>(r: MaybeComputedRef<T>): T {
  return typeof r === 'function'
    ? (r as any)()
    : unref(r)
}

export function headersToObject(headers: HeadersInit = {}): Record<string, string> {
  // SSR compatibility for `Headers` prototype
  if (typeof Headers !== 'undefined' && headers instanceof Headers)
    return Object.fromEntries([...headers.entries()])

  if (Array.isArray(headers))
    return Object.fromEntries(headers)

  return headers as Record<string, string>
}
