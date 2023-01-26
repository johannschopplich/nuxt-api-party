import { unref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { NitroFetchOptions } from 'nitropack'
import type { ApiFetchOptions } from './composables/$api'
import { formDataToObject, isFormData, isSerializedFormData, objectToFormData } from './formData'

export type EndpointFetchOptions = NitroFetchOptions<string> & {
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

export async function serializeMaybeEncodedBody(value: ApiFetchOptions['body']) {
  if (isFormData(value))
    return await formDataToObject(value)

  return value
}

export function deserializeMaybeEncodedBody(value: ApiFetchOptions['body']) {
  if (isSerializedFormData(value))
    return objectToFormData(value)

  return value
}
