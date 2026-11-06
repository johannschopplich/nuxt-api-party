import { createError } from 'h3'

/* eslint-disable no-control-regex -- URL parsers strip leading and trailing C0 controls, so the checks look past them. */

/**
 * Throws a 400 for a path that a URL parser or the backend behind it could read as absolute or as
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
