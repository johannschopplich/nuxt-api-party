import type { AllowedRoute } from '../src/runtime/types'
import { describe, expect, it } from 'vitest'
import { assertAllowedRoute, assertNoDotSegments, resolveRoutePath } from '../src/runtime/server/path'

const ROUTES: AllowedRoute[] = [
  { path: '/articles/**', methods: ['GET'] },
  { path: '/comments/*' },
  // A non-trailing `**` is a literal segment.
  { path: '/users/**/avatar' },
  { path: '/a^b' },
  // Resolved as a whole, this pattern would read as `/**`.
  { path: '/legacy/../**' },
]

function statusFor(allowedRoutes: AllowedRoute[] | undefined, method: string, routePath: string) {
  return statusOf(() => assertAllowedRoute(allowedRoutes, routePath, method))
}

function statusOf(check: () => unknown) {
  try {
    check()
    return 200
  }
  catch (error) {
    return (error as { statusCode: number }).statusCode
  }
}

describe('assertNoDotSegments', () => {
  it.each([
    'articles/../admin',
    'articles/./1',
    'articles/%2e%2e/admin',
    'articles/..%2Fadmin',
    'articles/..%5Cadmin',
    'articles/..\\admin',
    'articles/..;/admin',
    'articles/..%3B/admin',
    'articles/.\n./admin',
    'articles/.. ',
    'articles/..\u0000',
    'articles/..\u2028/admin',
  ])('rejects %j', (path) => {
    expect(statusOf(() => assertNoDotSegments(path))).toBe(400)
  })

  it.each([
    'comments/group%2Fname',
    'files/a..b',
    '.well-known/openid-configuration',
    'articles?next=../admin',
  ])('accepts %j', (path) => {
    expect(statusOf(() => assertNoDotSegments(path))).toBe(200)
  })
})

describe('resolveRoutePath', () => {
  it('returns the pathname below the base path without the query', () => {
    expect(resolveRoutePath('http://h/base/articles/1?page=2', 'http://h/base')).toBe('/articles/1')
  })

  it('rejects a sibling path that shares the base path as a prefix', () => {
    expect(statusOf(() => resolveRoutePath('http://h/basement', 'http://h/base'))).toBe(400)
  })
})

describe('assertAllowedRoute', () => {
  it.each([
    ['GET', '/articles'],
    ['GET', '/articles/1/comments'],
    ['get', '/articles/1'],
    ['POST', '/comments/1'],
    ['GET', '/a%5Eb'],
  ])('admits %s %s', (method, routePath) => {
    expect(statusFor(ROUTES, method, routePath)).toBe(200)
  })

  it.each([
    ['DELETE', '/articles/1'],
    ['HEAD', '/articles/1'],
    ['GET', '/comments/1/replies'],
    ['GET', '/comments//'],
    ['GET', '/users/1/avatar'],
    ['GET', '/admin'],
  ])('refuses %s %s', (method, routePath) => {
    expect(statusFor(ROUTES, method, routePath)).toBe(403)
  })

  it('admits every request without allowedRoutes', () => {
    expect(statusFor(undefined, 'DELETE', '/admin')).toBe(200)
  })

  it('refuses every request with an empty allowedRoutes', () => {
    expect(statusFor([], 'GET', '/articles')).toBe(403)
  })

  it('refuses every method with an empty methods list', () => {
    expect(statusFor([{ path: '/articles', methods: [] }], 'GET', '/articles')).toBe(403)
  })
})
