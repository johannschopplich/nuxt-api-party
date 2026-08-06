import { describe, expect, it } from 'vitest'
import { isForwardableClientHeader, mergeHeaders } from '../src/runtime/utils'

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

describe('isForwardableClientHeader', () => {
  const endpointId = 'jsonPlaceholder'

  it('forwards an unremarkable header', () => {
    expect(isForwardableClientHeader('accept', { endpointId })).toBe(true)
  })

  it('withholds authorization', () => {
    expect(isForwardableClientHeader('authorization', { endpointId })).toBe(false)
  })

  it('withholds the endpoint URL override', () => {
    expect(isForwardableClientHeader('jsonPlaceholder-Endpoint-Url', { endpointId })).toBe(false)
  })

  it('matches whatever casing the client used', () => {
    expect(isForwardableClientHeader('Authorization', { endpointId })).toBe(false)
    expect(isForwardableClientHeader('jsonplaceholder-endpoint-url', { endpointId })).toBe(false)
  })

  it('withholds cookie when the endpoint leaves cookies unset', () => {
    expect(isForwardableClientHeader('cookie', { endpointId })).toBe(false)
  })

  it('withholds cookie when the endpoint sets cookies to false', () => {
    expect(isForwardableClientHeader('cookie', { endpointId, cookies: false })).toBe(false)
  })

  it('forwards cookie when the endpoint sets cookies to true', () => {
    expect(isForwardableClientHeader('cookie', { endpointId, cookies: true })).toBe(true)
  })
})
