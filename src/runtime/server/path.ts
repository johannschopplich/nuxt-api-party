import type { AllowedRoute } from '../types'
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

/**
 * Throws a 400 for a path with a tab, a line break, or a dot segment, even one that is encoded,
 * delimited by `#`, `%2F` or `%5C`, or followed by `;` or by nothing but spaces and C0 controls.
 * The WHATWG parser, Nitro's in-process fetch and backends each resolve a different subset of
 * these dot segments, and `ufo` cuts a URL at a line break.
 */
export function assertNoDotSegments(path: string) {
  const segments = path.split('?', 1)[0]!.replace(/%2e/gi, '.').replace(/%3b/gi, ';').replace(/%2f|%5c/gi, '/').split(/[/\\#]/)

  if (
    /[\t\n\r\u2028\u2029]/.test(path)
    // eslint-disable-next-line no-control-regex -- A reader may strip spaces and C0 controls after the dots.
    || segments.some(segment => /^\.{1,2}(?:;|[\u0000-\u0020]*$)/.test(segment))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path must not contain tabs, line breaks or dot segments',
    })
  }
}

/**
 * Returns the pathname the backend receives for `requestURL`, relative to the pathname of
 * `baseURL`, or throws a 400 when it lies outside it. `requestURL` must be joined onto
 * `baseURL` the way the outgoing request joins it: the join leaves dot segments, their
 * encoded forms and backslashes for the WHATWG parser to resolve.
 */
export function resolveRoutePath(requestURL: string, baseURL: string) {
  // Relative base URLs point to the Nuxt server itself, so any origin serves to resolve them.
  const base = new URL(baseURL, 'http://localhost')
  const target = new URL(requestURL, base)
  const basePath = base.pathname.replace(/\/$/, '')

  if (
    target.origin !== base.origin
    || (target.pathname !== basePath && !target.pathname.startsWith(`${basePath}/`))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path leaves the endpoint base URL',
    })
  }

  return target.pathname.slice(basePath.length) || '/'
}

/**
 * Throws a 403 unless `allowedRoutes` is unset or one of its entries admits the request;
 * `routePath` is what `resolveRoutePath` returns.
 */
export function assertAllowedRoute(
  allowedRoutes: AllowedRoute[] | undefined,
  routePath: string,
  method: string,
) {
  if (!allowedRoutes)
    return

  const requestMethod = method.toUpperCase()
  const pathSegments = splitPath(routePath)
  const isAllowed = allowedRoutes.some(route =>
    (!route.methods || route.methods.some(routeMethod => routeMethod.toUpperCase() === requestMethod))
    && matchesPattern(splitPath(route.path).map(encodePathSegment), pathSegments),
  )

  if (!isAllowed) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Route is not allowed',
    })
  }
}

/**
 * Percent-encodes `segment` with the WHATWG path percent-encode set, as the pathname it is
 * matched against is encoded. Unlike a full URL parse, it neither resolves dot segments or
 * backslashes nor drops what follows `?` or `#`, so a pattern cannot match more than it reads.
 */
function encodePathSegment(segment: string) {
  // eslint-disable-next-line no-control-regex -- The set starts with the C0 controls.
  return segment.replace(/[\u0000-\u0020"#<>?^`{}\u007F-\u{10FFFF}]/gu, character => encodeURIComponent(character))
}

function splitPath(path: string) {
  return path.replace(/^\/|\/$/g, '').split('/')
}

function matchesPattern(patternSegments: string[], pathSegments: string[]) {
  for (const [index, patternSegment] of patternSegments.entries()) {
    if (patternSegment === '**' && index === patternSegments.length - 1)
      return true

    const pathSegment = pathSegments[index]
    if (pathSegment === undefined)
      return false
    if (patternSegment === '*' ? pathSegment === '' : patternSegment !== pathSegment)
      return false
  }

  return patternSegments.length === pathSegments.length
}
