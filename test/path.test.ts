import { describe, expect, it } from 'vitest'
import { assertNoDotSegments } from '../src/runtime/server/path'

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
