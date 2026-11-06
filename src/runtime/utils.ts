/**
 * Merges headers into a plain object, where a later source replaces a header an earlier one set.
 *
 * @remarks
 * A plain object, since `useRequestFetch` spreads the headers during SSR, which empties a `Headers` instance.
 */
export function mergeHeaders(...headers: (HeadersInit | undefined)[]): Record<string, string> {
  const merged: Record<string, string> = {}

  for (const source of headers) {
    for (const [name, value] of new Headers(source))
      merged[name] = value
  }

  return merged
}

/**
 * Collects the headers an endpoint adds to each of its requests, where the token replaces an `Authorization` among
 * its `headers`.
 */
export function getEndpointHeaders(endpoint: { token?: string, headers?: Record<string, string> }) {
  return mergeHeaders(endpoint.headers, endpoint.token ? { Authorization: `Bearer ${endpoint.token}` } : undefined)
}
