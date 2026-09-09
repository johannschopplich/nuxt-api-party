import { createError } from 'h3'
import { hasProtocol } from 'ufo'

/**
 * Throws a 400 for a path that would leave the endpoint's host once `$fetch` joins it
 * onto `baseURL`.
 *
 * `ofetch` skips that join whenever `ufo`'s `hasProtocol` finds a scheme, and it finds
 * one in `http:host/x` and in `http://` behind any `\s` character. The WHATWG parser
 * that resolves the outgoing request reads both as relative, so a path has to count as
 * relative under both checks before it is fetched.
 */
export function assertRelativePath(path: string) {
  // TODO: Drop the `hasProtocol` check once Nitro ships `ofetch` 2, which no longer joins through `ufo`.
  if (
    hasProtocol(path, { acceptRelative: true })
    || new URL(path, 'http://localhost').origin !== 'http://localhost'
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Absolute URLs are not allowed',
    })
  }
}
