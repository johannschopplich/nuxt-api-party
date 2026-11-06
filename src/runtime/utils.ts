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
 * Decides whether a header the browser sent to the proxy may travel on to the
 * upstream API.
 *
 * A cookie travels only for endpoints that opt in, and `authorization` never –
 * forwarding it would hand the caller's own credentials to a third party.
 */
export function isForwardableProxyHeader(name: string, { cookies }: { cookies?: boolean }) {
  const header = name.toLowerCase()

  if (header === 'cookie')
    return Boolean(cookies)

  return header !== 'authorization'
}

/**
 * Decides whether a header a composable put in the request body may travel on
 * to the upstream API.
 *
 * Only `cookie` is dropped: the server handler reads one off its own request,
 * where the endpoint's `cookies` option decides.
 */
export function isForwardableBodyHeader(name: string) {
  return name.toLowerCase() !== 'cookie'
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
