// The assertions run against the playground's build output, which is where a
// schema endpoint exists and where `#nuxt-api-party/petStore` is declared.
/// <reference path="../playground/.nuxt/module/nuxt-api-party.schema.d.ts" />

import type { components as PetStoreComponents } from '#nuxt-api-party/petStore'
import type { $petStore, PetStore, PetStoreApiMethods } from '../playground/.nuxt/module/nuxt-api-party'
import { describe, expectTypeOf, it } from 'vitest'

declare const petStore: typeof $petStore

describe('PetStore', () => {
  it('extracts the path parameters of a templated path', () => {
    expectTypeOf<PetStore<'/pet/{petId}', 'get'>['path']>().toEqualTypeOf<{ petId: number }>()
  })

  it('types the parameters as never for an operation that declares none', () => {
    expectTypeOf<PetStore<'/pet', 'post'>['path']>().toBeNever()
    expectTypeOf<PetStore<'/pet', 'post'>['query']>().toBeNever()
  })

  it('extracts a required request body', () => {
    expectTypeOf<PetStore<'/pet', 'post'>['request']>().toEqualTypeOf<PetStoreComponents['schemas']['Pet']>()
  })

  it('widens an optional request body with undefined', () => {
    expectTypeOf<PetStore<'/store/order', 'post'>['request']>()
      .toEqualTypeOf<PetStoreComponents['schemas']['Order'] | undefined>()
  })

  it('extracts a request body sent as application/octet-stream', () => {
    expectTypeOf<PetStore<'/pet/{petId}/uploadImage', 'post'>['request']>().toEqualTypeOf<string | undefined>()
  })

  it('types the request body as undefined for an operation that declares none', () => {
    expectTypeOf<PetStore<'/pet/{petId}', 'get'>['request']>().toEqualTypeOf<undefined>()
  })

  it('extracts the body of the successful response', () => {
    expectTypeOf<PetStore<'/pet/{petId}', 'get'>['response']>().toEqualTypeOf<PetStoreComponents['schemas']['Pet']>()
  })

  it('resolves the response the way a call through $petStore does', () => {
    expectTypeOf(() => petStore('/pet/{petId}', { method: 'get', path: { petId: 1 } }))
      .returns
      .resolves
      .toEqualTypeOf<PetStore<'/pet/{petId}', 'get'>['response']>()

    expectTypeOf(() => petStore('/pet/{petId}', { method: 'delete', path: { petId: 1 } }))
      .returns
      .resolves
      .toEqualTypeOf<PetStore<'/pet/{petId}', 'delete'>['response']>()
  })

  it('keys the responses by status code', () => {
    expectTypeOf<PetStore<'/pet/{petId}', 'get'>['responses']>().toEqualTypeOf<{
      200: PetStoreComponents['schemas']['Pet']
      400: undefined
      404: undefined
    }>()
  })

  it('rejects a method the path leaves undeclared', () => {
    // @ts-expect-error: `/pet` declares `post` and `put`, and no `get`.
    expectTypeOf<PetStore<'/pet', 'get'>>().not.toBeNever()
  })
})

describe('PetStoreApiMethods', () => {
  it('lists only the methods a path declares', () => {
    expectTypeOf<PetStoreApiMethods<'/pet'>>().toEqualTypeOf<'post' | 'put'>()
    expectTypeOf<PetStoreApiMethods<'/pet/{petId}'>>().toEqualTypeOf<'get' | 'post' | 'delete'>()
  })
})
