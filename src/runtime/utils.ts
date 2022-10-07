export const apiServerRoute = '/api/__api_party__'

export function headersToObject(headers: HeadersInit = {}): Record<string, string> {
  // SSR compatibility for `Headers` prototype
  if (typeof Headers !== 'undefined' && headers instanceof Headers)
    return Object.fromEntries([...headers.entries()])

  if (Array.isArray(headers))
    return Object.fromEntries(headers)

  return headers as Record<string, string>
}
