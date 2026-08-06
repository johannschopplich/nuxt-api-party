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
  const endpointId = 'jsonPlaceholder'

  it('forwards an unremarkable header', () => {
    expect(isForwardableProxyHeader('accept', { endpointId })).toBe(true)
  })

  it('withholds authorization', () => {
    expect(isForwardableProxyHeader('authorization', { endpointId })).toBe(false)
  })

  it('withholds the endpoint URL override', () => {
    expect(isForwardableProxyHeader('jsonPlaceholder-Endpoint-Url', { endpointId })).toBe(false)
  })

  it('matches whatever casing the browser used', () => {
    expect(isForwardableProxyHeader('Authorization', { endpointId })).toBe(false)
    expect(isForwardableProxyHeader('jsonplaceholder-endpoint-url', { endpointId })).toBe(false)
  })

  it('withholds cookie when the endpoint leaves cookies unset', () => {
    expect(isForwardableProxyHeader('cookie', { endpointId })).toBe(false)
  })

  it('withholds cookie when the endpoint sets cookies to false', () => {
    expect(isForwardableProxyHeader('cookie', { endpointId, cookies: false })).toBe(false)
  })

  it('forwards cookie when the endpoint sets cookies to true', () => {
    expect(isForwardableProxyHeader('cookie', { endpointId, cookies: true })).toBe(true)
  })
})

describe('isForwardableBodyHeader', () => {
  const endpointId = 'jsonPlaceholder'

  it('forwards authorization', () => {
    expect(isForwardableBodyHeader('authorization', { endpointId })).toBe(true)
  })

  it('withholds the endpoint URL override', () => {
    expect(isForwardableBodyHeader('jsonPlaceholder-Endpoint-Url', { endpointId })).toBe(false)
  })

  it('withholds cookie regardless of the endpoint', () => {
    expect(isForwardableBodyHeader('cookie', { endpointId })).toBe(false)
  })
})
