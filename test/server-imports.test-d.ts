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

  it('rejects the options that only a browser-side call acts on', () => {
    // @ts-expect-error: there is no browser to send from.
    jsonPlaceholder('posts/1', { client: true })
    // @ts-expect-error: there is no Nuxt payload on the server.
    jsonPlaceholder('posts/1', { payloadCache: true })
    // @ts-expect-error: `key` addresses the payload cache.
    jsonPlaceholder('posts/1', { key: 'posts' })
    // @ts-expect-error: the server handler calls `globalThis.$fetch` directly.
    jsonPlaceholder('posts/1', { $fetch: undefined })
  })
})

describe('$petStore', () => {
  it('types the response from the schema', () => {
    expectTypeOf(petStore('/pet/{petId}', { path: { petId: 1 } }))
      .resolves
      .toEqualTypeOf<PetStoreComponents['schemas']['Pet']>()
  })

  it('rejects the options that only a browser-side call acts on', () => {
    // @ts-expect-error: there is no browser to send from.
    petStore('/pet/{petId}', { path: { petId: 1 }, client: true })
    // @ts-expect-error: there is no Nuxt payload on the server.
    petStore('/pet/{petId}', { path: { petId: 1 }, payloadCache: true })
  })
})
