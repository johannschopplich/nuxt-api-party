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
 * Decides whether a header the client sent may travel on to the upstream API.
 *
 * `authorization` would hand the caller's own credentials to a third party, and
 * the endpoint URL override is api-party's own control header, meaningless
 * upstream. A cookie travels only for endpoints that opt in.
 */
export function isForwardableClientHeader(
  name: string,
  { endpointId, cookies }: { endpointId: string, cookies?: boolean },
) {
  const header = name.toLowerCase()

  if (header === 'cookie')
    return Boolean(cookies)

  return header !== 'authorization'
    && header !== `${endpointId.toLowerCase()}-endpoint-url`
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
