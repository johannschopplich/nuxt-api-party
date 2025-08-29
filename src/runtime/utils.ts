import type { ApiClientFetchOptions } from './composables/$api'
import { formDataToObject, isFormData, isSerializedFormData, objectToFormData } from './form-data'

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

type FilteredObject<T extends object> = {
  [K in keyof T]: Exclude<T[K], undefined>
}

/**
 * Losslessly merges multiple `HeadersInit` objects, preserving duplicates.
 */
export function mergeHeaders(...headers: (HeadersInit | undefined)[]) {
  return new Headers(headers.filter(Boolean).flatMap(h => [...new Headers(h)]))
}

/**
 * Returns a copy of `object`, omitting keys whose value is `undefined`.
 */
export function omitUndefinedValues<T extends object>(object: T) {
  return Object.fromEntries(
    Object.entries(object)
      .filter(([, value]) => value !== undefined),
  ) as FilteredObject<T>
}
