/**
 * Losslessly merges multiple `HeadersInit` objects, preserving duplicates.
 *
 * @param headers - An array of `HeadersInit` or `undefined` values to merge
 * @return A new Headers object containing all merged headers
 */
export function mergeHeaders(...headers: (HeadersInit | undefined)[]) {
  return new Headers(headers.filter(Boolean).flatMap(h => [...new Headers(h)]))
}
