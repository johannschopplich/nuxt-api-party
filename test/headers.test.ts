import { describe, expect, it } from 'vitest'
import { mergeHeaders } from '../src/runtime/utils'

describe('mergeHeaders', () => {
  it('merges headers without duplicates', () => {
    const headers1 = {
      'x-api-party': 'nuxt-api-party',
      'Content-Type': 'application/json',
    }
    const headers2 = {
      'x-api-party': 'nuxt-api-party',
    }

    expect([...mergeHeaders(headers1, headers2)]).toMatchInlineSnapshot(`
      [
        [
          "content-type",
          "application/json",
        ],
        [
          "x-api-party",
          "nuxt-api-party, nuxt-api-party",
        ],
      ]
    `)
  })
})
