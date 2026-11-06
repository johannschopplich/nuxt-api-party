import { describe, expect, it } from 'vitest'
import { assertPathBelowBase } from '../src/runtime/server/path'

function statusOf(check: () => unknown) {
  try {
    check()
    return 200
  }
  catch (error) {
    return (error as { statusCode: number }).statusCode
  }
}

describe('assertPathBelowBase', () => {
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
    expect(statusOf(() => assertPathBelowBase(path))).toBe(400)
  })

  it.each([
    'comments/group%2Fname',
    'files/a..',
    'v1/files:copy',
    '.well-known/openid-configuration',
    'articles?next=/../admin',
  ])('accepts %j', (path) => {
    expect(statusOf(() => assertPathBelowBase(path))).toBe(200)
  })
})
