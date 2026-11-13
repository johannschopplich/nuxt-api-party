export function mergeHeaders(...headers: (HeadersInit | undefined)[]): Record<string, string> {
  const merged: Record<string, string> = {}

  for (const source of headers) {
    for (const [name, value] of new Headers(source))
      merged[name] = value
  }

  return merged
}

export function getEndpointHeaders(endpoint: { token?: string, headers?: Record<string, string> }) {
  // Nitro fills an unset runtime config value with an empty string.
  return mergeHeaders(endpoint.headers || undefined, endpoint.token
    ? { Authorization: `Bearer ${endpoint.token}` }
    : undefined)
}
