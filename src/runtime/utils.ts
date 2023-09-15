import { unref } from 'vue'
import { formDataToObject, isFormData, isSerializedFormData, objectToFormData } from './formData'
import type { MaybeRefOrGetter } from './types'
import type { ApiFetchOptions } from './composables/$api'

export function toValue<T>(r: MaybeRefOrGetter<T>): T {
  return typeof r === 'function'
    ? (r as (...args: any[]) => any)()
    : unref(r)
}

export function headersToObject(headers: HeadersInit = {}): Record<string, string> {
  if (headers instanceof Headers)
    return Object.fromEntries([...headers.entries()])

  if (Array.isArray(headers))
    return Object.fromEntries(headers)

  return headers
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

export function resolvePath(path: string, params?: Record<string, MaybeRefOrGetter<unknown>>) {
  // To simplify typings, OpenAPI path parameters can be expanded here
  if (params) {
    return Object.entries(params).reduce(
      (path, [name, value]) => path.replace(`{${name}}`, encodeURIComponent(String(toValue(value)))),
      path,
    )
  }

  return path
}
