import { unref } from 'vue'
import type { H3Event } from 'h3'
import type { NitroFetchOptions } from 'nitropack'
import type { ComputedRef, Ref } from 'vue'
import type { NuxtApp } from 'nuxt/app'
import type { ApiFetchOptions } from './composables/$api'
import { formDataToObject, isFormData, isSerializedFormData, objectToFormData } from './formData'

export type EndpointFetchOptions = NitroFetchOptions<string> & {
  path: string
}

export type MaybeRef<T> = T | Ref<T>
export type MaybeComputedRef<T> = MaybeReadonlyRef<T> | MaybeRef<T>
export type MaybeReadonlyRef<T> = (() => T) | ComputedRef<T>

export function resolveUnref<T>(r: MaybeComputedRef<T>): T {
  return typeof r === 'function'
    ? (r as any)()
    : unref(r)
}

export function getFetchHandler(nuxt: NuxtApp, { localFetch = true } = {}): typeof global.$fetch {
  if (process.client || !localFetch)
    return globalThis.$fetch

  // Use fetch with request context and headers for server direct API calls
  const event = nuxt.ssrContext?.event as H3Event
  return (event?.$fetch as typeof globalThis.$fetch) || globalThis.$fetch
}

export function headersToObject(headers: HeadersInit = {}): Record<string, string> {
  if (typeof Headers !== 'undefined' && headers instanceof Headers)
    return Object.fromEntries([...headers.entries()])

  if (Array.isArray(headers))
    return Object.fromEntries(headers)

  return headers as Record<string, string>
}

export async function serializeMaybeEncodedBody(value: ApiFetchOptions['body']) {
  if (isFormData(value))
    return await formDataToObject(value)

  return value
}

export async function deserializeMaybeEncodedBody(value: ApiFetchOptions['body']) {
  if (isSerializedFormData(value))
    return await objectToFormData(value)

  return value
}
