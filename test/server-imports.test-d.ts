// The assertions run against the playground's build output, which is where the
// Nitro declarations for `$jsonPlaceholder` and `$petStore` are generated.
/// <reference path="../playground/.nuxt/module/nuxt-api-party.schema.d.ts" />

import type { components as PetStoreComponents } from '#nuxt-api-party/petStore'
import type { $jsonPlaceholder, $petStore } from '../playground/.nuxt/module/nuxt-api-party.nitro'
import { describe, expectTypeOf, it } from 'vitest'

declare const jsonPlaceholder: typeof $jsonPlaceholder
declare const petStore: typeof $petStore

describe('$jsonPlaceholder', () => {
  it('returns the response type the call names', () => {
    expectTypeOf(jsonPlaceholder<{ title: string }>('posts/1')).resolves.toEqualTypeOf<{ title: string }>()
  })

  it('accepts the request options the server handler forwards', () => {
    expectTypeOf(jsonPlaceholder).toBeCallableWith('posts/:id', {
      path: { id: '1' },
      method: 'POST',
      query: { draft: true },
      headers: { 'x-trace': 'abc' },
      body: { title: 'Hello' },
    })
  })
})

describe('$petStore', () => {
  it('types the response from the schema', () => {
    expectTypeOf(petStore('/pet/{petId}', { path: { petId: 1 } }))
      .resolves
      .toEqualTypeOf<PetStoreComponents['schemas']['Pet']>()
  })
})
