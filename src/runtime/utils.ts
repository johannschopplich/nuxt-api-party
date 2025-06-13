import type { ApiClientFetchOptions } from './composables/$api'
import { formDataToObject, isFormData, isSerializedFormData, objectToFormData } from './form-data'

/**
 * Losslessly merge all headers, preserving duplicates.
 *
 * @param headers - An array of HeadersInit or undefined values to merge
 * @return A new Headers object containing all merged headers
 */
export function mergeHeaders(...headers: Array<HeadersInit | undefined>): Headers {
  return new Headers(headers.flatMap(h => [...new Headers(h)]))
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
