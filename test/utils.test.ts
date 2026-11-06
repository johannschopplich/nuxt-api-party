import { describe, expect, it } from 'vitest'
import { isForwardableBodyHeader, isForwardableProxyHeader, mergeHeaders } from '../src/runtime/utils'

describe('mergeHeaders', () => {
  it('lowercases header names', () => {
    const merged = mergeHeaders({ 'Content-Type': 'application/json' })

    expect([...merged]).toEqual([['content-type', 'application/json']])
  })

  it('joins a header repeated across sources into one entry', () => {
    const merged = mergeHeaders(
      { 'x-api-party': 'first' },
      { 'x-api-party': 'second' },
    )

    expect(merged.get('x-api-party')).toBe('first, second')
  })

  it('skips undefined sources', () => {
    const merged = mergeHeaders(undefined, { accept: 'application/json' }, undefined)

    expect([...merged]).toEqual([['accept', 'application/json']])
  })
})

describe('isForwardableProxyHeader', () => {
  it('forwards accept', () => {
    expect(isForwardableProxyHeader('accept', {})).toBe(true)
  })

  it('withholds authorization', () => {
    expect(isForwardableProxyHeader('authorization', {})).toBe(false)
  })

  it('matches whatever casing the browser used', () => {
    expect(isForwardableProxyHeader('Authorization', {})).toBe(false)
  })

  it('withholds cookie when the endpoint leaves cookies unset', () => {
    expect(isForwardableProxyHeader('cookie', {})).toBe(false)
  })

  it('withholds cookie when the endpoint sets cookies to false', () => {
    expect(isForwardableProxyHeader('cookie', { cookies: false })).toBe(false)
  })

  it('forwards cookie when the endpoint sets cookies to true', () => {
    expect(isForwardableProxyHeader('cookie', { cookies: true })).toBe(true)
  })
})

describe('isForwardableBodyHeader', () => {
  it('forwards authorization', () => {
    expect(isForwardableBodyHeader('authorization')).toBe(true)
  })

  it('withholds cookie regardless of the endpoint', () => {
    expect(isForwardableBodyHeader('cookie')).toBe(false)
  })
})
