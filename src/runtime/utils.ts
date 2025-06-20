import type { ApiClientFetchOptions } from './composables/$api'
import { formDataToObject, isFormData, isSerializedFormData, objectToFormData } from './form-data'

/**
 * Losslessly merges multiple `HeadersInit` objects, preserving duplicates.
 *
 * @param headers - An array of `HeadersInit` or `undefined` values to merge
 * @return A new Headers object containing all merged headers
 */
export function mergeHeaders(...headers: (HeadersInit | undefined)[]) {
  return new Headers(headers.filter(Boolean).flatMap(h => [...new Headers(h)]))
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

type FilteredObject<T extends object> = {
  [K in keyof T]: Exclude<T[K], undefined>
}

/** Return a copy of `object`, omitting keys whose value is `undefined`.  */
export function omitUndefinedValues<T extends object>(object: T): FilteredObject<T> {
  return Object.fromEntries(
    Object.entries(object)
      .filter(([,value]) => value !== undefined),
  ) as FilteredObject<T>
}
