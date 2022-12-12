import { unref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { FetchOptions } from 'ofetch'

export type EndpointFetchOptions = FetchOptions & {
  path: string
}

export type MaybeComputedRef<T> = (() => T) | ComputedRef<T> | Ref<T> | T

export function resolveUnref<T>(r: MaybeComputedRef<T>): T {
  return typeof r === 'function'
    ? (r as any)()
    : unref(r)
}

export function headersToObject(headers: HeadersInit = {}): Record<string, string> {
  if (typeof Headers !== 'undefined' && headers instanceof Headers)
    return Object.fromEntries([...headers.entries()])

  if (Array.isArray(headers))
    return Object.fromEntries(headers)

  return headers as Record<string, string>
}

export function isFormData(obj: unknown): obj is FormData {
  return typeof FormData !== 'undefined' && obj instanceof FormData
}

export function serializeFormData(data: FormData) {
  const body = data.toString()
  const headers: Record<string, string> = {
    'Content-Type': 'multipart/form-data',
    // Calculate content size
    'Content-Length': `${[...data.entries()].reduce((size, [, value]) => {
      if (value instanceof File)
        return size + value.size
      if (typeof value === 'string')
        return size + value.length
      return size
    }, 0)}`,
  }

  return { body, headers }
}
