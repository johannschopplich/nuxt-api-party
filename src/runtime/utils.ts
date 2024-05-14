import { formDataToObject, isFormData, isSerializedFormData, objectToFormData } from './form-data'
import type { ApiClientFetchOptions } from './composables/$api'

export function headersToObject(headers: HeadersInit = {}): Record<string, string> {
  return Object.fromEntries(new Headers(headers))
}

export async function serializeMaybeEncodedBody(value: ApiClientFetchOptions['body']) {
  if (isFormData(value))
    return await formDataToObject(value)

  return value
}

export async function deserializeMaybeEncodedBody(value: ApiClientFetchOptions['body']) {
  if (isSerializedFormData(value))
    return await objectToFormData(value)

  return value
}
