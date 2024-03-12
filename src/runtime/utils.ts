import { toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { formDataToObject, isFormData, isSerializedFormData, objectToFormData } from './formData'
import type { ApiFetchOptions } from './composables/$api'

export function headersToObject(headers: HeadersInit = {}): Record<string, string> {
  if (headers instanceof Headers || Array.isArray(headers))
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

export function resolvePathParams(path: string, params?: Record<string, MaybeRefOrGetter<unknown>>) {
  // To simplify typings, OpenAPI path parameters can be expanded here
  if (params) {
    for (const [key, value] of Object.entries(params))
      path = path.replace(`{${key}}`, encodeURIComponent(String(toValue(value))))
  }

  return path
}
