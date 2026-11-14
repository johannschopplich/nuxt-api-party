import type { AllowedRoute } from '../src/runtime/types'
import { describe, expect, it } from 'vitest'
import { isAllowedRoute, isPathBelowBase, resolveRoutePath } from '../src/runtime/server/path'

const ROUTES: AllowedRoute[] = [
  {
    path: '/articles/**',
    methods: ['GET'],
  },
  { path: '/comments/*' },
  // A non-trailing `**` is a literal segment.
  { path: '/users/**/avatar' },
  { path: '/a^b' },
  { path: '/users/@me' },
  { path: '/accounts/%40me' },
  // Resolved as a whole, this pattern would read as `/**`.
  { path: '/legacy/../**' },
]

describe('isPathBelowBase', () => {
  it.each([
    '1:2/x',
    'a%2Fb:c',
    ' \\\\h.test/x',
    'x http://h.test/x',
    '\u0001//h.test/x',
    '/ /h.test/x',
    'articles/../admin',
    'articles/./1',
    'articles/%2e%2e/admin',
    'articles/..%2Fadmin',
    'articles/..%5Cadmin',
    'articles/..\\admin',
    'articles/..%3B/admin',
    'articles/.. ',
    'articles/..\u0000',
    'articles/..\nfoo',
    'articles/..\rfoo',
    'articles/\u2028admin',
    'articles/\u2029admin',
    'articles/\tadmin',
    'articles#/../admin',
    'articles/..#x',
  ])('rejects %j', (path) => {
    expect(isPathBelowBase(path)).toBe(false)
  })

  it.each([
    'comments/group%2Fname',
    'files/a..',
    'v1/files:copy',
    '.well-known/openid-configuration',
    'articles?next=/../admin',
  ])('accepts %j', (path) => {
    expect(isPathBelowBase(path)).toBe(true)
  })
})

describe('resolveRoutePath', () => {
  it.each([
    ['http://h/base/articles', 'http://h/base', '/articles'],
    ['http://h/base', 'http://h/base', '/'],
    // A shared prefix is no path below the base.
    ['http://h/basement', 'http://h/base', undefined],
    ['http://other/base/articles', 'http://h/base', undefined],
  ])('resolves %s below %s to %s', (requestURL, baseURL, routePath) => {
    expect(resolveRoutePath(requestURL, baseURL)).toBe(routePath)
  })
})

describe('isAllowedRoute', () => {
  it.each([
    ['GET', '/articles'],
    ['GET', '/articles/1/comments'],
    ['get', '/articles/1'],
    ['POST', '/comments/1'],
    ['GET', '/a%5Eb'],
    ['GET', '/users/@me'],
    ['GET', '/accounts/%40me'],
  ])('admits %s %s', (method, routePath) => {
    expect(isAllowedRoute(ROUTES, routePath, method)).toBe(true)
  })

  it.each([
    ['DELETE', '/articles/1'],
    ['HEAD', '/articles/1'],
    ['GET', '/comments/1/replies'],
    ['GET', '/comments//'],
    ['GET', '/users/1/avatar'],
    ['GET', '/admin'],
    ['GET', '/users/%40me'],
  ])('refuses %s %s', (method, routePath) => {
    expect(isAllowedRoute(ROUTES, routePath, method)).toBe(false)
  })

  it('admits every request without allowedRoutes', () => {
    expect(isAllowedRoute(undefined, '/admin', 'DELETE')).toBe(true)
  })

  it('refuses every request with an empty allowedRoutes', () => {
    expect(isAllowedRoute([], '/articles', 'GET')).toBe(false)
  })

  it('refuses every method with an empty methods list', () => {
    expect(isAllowedRoute([
      { path: '/articles', methods: [] },
    ], '/articles', 'GET')).toBe(false)
  })
})
