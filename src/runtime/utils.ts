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

function isEndpointUrlOverride(header: string, endpointId: string) {
  return header === `${endpointId.toLowerCase()}-endpoint-url`
}

/**
 * Decides whether a header the browser sent to the proxy may travel on to the
 * upstream API.
 *
 * The browser attaches `authorization` and `cookie` on its own, and neither is
 * meant for a third party: the cookie travels only for endpoints that opt in,
 * the credentials never. The endpoint URL override is api-party's own control
 * header and is consumed here.
 */
export function isForwardableProxyHeader(
  name: string,
  { endpointId, cookies }: { endpointId: string, cookies?: boolean },
) {
  const header = name.toLowerCase()

  if (header === 'cookie')
    return Boolean(cookies)

  return header !== 'authorization'
    && !isEndpointUrlOverride(header, endpointId)
}

/**
 * Decides whether a header a composable put in the request body may travel on
 * to the upstream API.
 *
 * These headers are the developer's own, so they pass unless api-party needs
 * them for itself: the endpoint URL override is a control header, and a cookie
 * is read off the server handler's request instead, where it can be weighed
 * against the endpoint's `cookies` option.
 */
export function isForwardableBodyHeader(name: string, { endpointId }: { endpointId: string }) {
  const header = name.toLowerCase()

  return header !== 'cookie' && !isEndpointUrlOverride(header, endpointId)
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
