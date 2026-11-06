import { describe, expect, it } from 'vitest'
import { mergeHeaders } from '../src/runtime/utils'

describe('mergeHeaders', () => {
  it('lowercases header names', () => {
    const merged = mergeHeaders({ 'Content-Type': 'application/json' })

    expect(merged).toEqual({ 'content-type': 'application/json' })
  })

  it('lets a later source replace a header an earlier one set', () => {
    const merged = mergeHeaders(
      { Authorization: 'Bearer endpoint-token' },
      { authorization: 'Basic call-credentials' },
    )

    expect(merged).toEqual({ authorization: 'Basic call-credentials' })
  })

  it('skips undefined sources', () => {
    const merged = mergeHeaders(undefined, { accept: 'application/json' }, undefined)

    expect(merged).toEqual({ accept: 'application/json' })
  })
})
