import type { AllowedRoute } from '../types'
import { createError } from 'h3'

/* eslint-disable no-control-regex -- URL parsers strip leading and trailing C0 controls and percent-encode the rest, so the checks name them. */

/**
 * Throws a 400 for a path that a URL parser or the API behind it could read as absolute or as
 * climbing above the base URL: a scheme, an authority, a tab or line break, or a dot segment, also
 * percent-encoded or with a `;` parameter.
 */
export function assertPathBelowBase(path: string) {
  const segments = path.split('?', 1)[0]!.replace(/%2e/gi, '.').replace(/%3b/gi, ';').split(/[/\\#]|%2f|%5c/i)

  if (
    /[\t\n\r\u2028\u2029]/.test(path)
    // RFC 3986 forbids a colon in the first segment of a relative path.
    || /^[^/?#]*:/.test(path)
    || /^[\s\u0000-\u001F]*(?:[/\\]\s*){2}/.test(path)
    || segments.some(segment => /^\.{1,2}(?:;|[\u0000-\u0020]*$)/.test(segment))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path must stay below the base URL',
    })
  }
}

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
      statusMessage: 'Path must stay below the base URL',
    })
  }

  return target.pathname.slice(basePath.length) || '/'
}

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

function splitPath(path: string) {
  return path.replace(/^\/|\/$/g, '').split('/')
}

/**
 * Percent-encodes `segment` like a WHATWG pathname. A full URL parse would also resolve dot
 * segments and cut at `?` and `#`, letting a pattern match more than it says.
 */
function encodePathSegment(segment: string) {
  return segment.replace(/[\u0000-\u0020"#<>?^`{}\u007F-\u{10FFFF}]/gu, character => encodeURIComponent(character))
}

function matchesPattern(patternSegments: string[], pathSegments: string[]) {
  for (const [index, patternSegment] of patternSegments.entries()) {
    if (patternSegment === '**' && index === patternSegments.length - 1)
      return true

    const pathSegment = pathSegments[index]
    if (pathSegment === undefined)
      return false
    if (patternSegment === '*'
      ? pathSegment === ''
      : patternSegment !== pathSegment) {
      return false
    }
  }

  return patternSegments.length === pathSegments.length
}
