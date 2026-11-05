import type { AllowedRoute } from '../src/runtime/types'
import { describe, expect, it } from 'vitest'
import { assertAllowedRoute } from '../src/runtime/server/path'

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
  try {
    assertAllowedRoute(allowedRoutes, routePath, method)
    return 200
  }
  catch (error) {
    return (error as { statusCode: number }).statusCode
  }
}

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
