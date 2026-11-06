import { describe, expect, it } from 'vitest'
import { mergeHeaders } from '../src/runtime/utils'

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
