/// <reference path="../playground/.nuxt/module/nuxt-api-party.schema.d.ts" />

import type { NuxtError } from 'nuxt/app'
import type { components as PetStoreComponents } from '#nuxt-api-party/petStore'
import type { $jsonPlaceholder, $petStore, useJsonPlaceholderData, usePetStoreData } from '../playground/.nuxt/module/nuxt-api-party'
import { describe, expectTypeOf, it } from 'vitest'

declare const jsonPlaceholder: typeof $jsonPlaceholder
declare const petStore: typeof $petStore
declare const useJsonPlaceholder: typeof useJsonPlaceholderData
declare const usePetStore: typeof usePetStoreData

describe('$jsonPlaceholder', () => {
  it('rejects a call-level client option', () => {
    // @ts-expect-error: the endpoint decides whether its requests skip the server proxy.
    jsonPlaceholder('posts/1', { client: true })
  })

  it('rejects payloadCache, key and $fetch', () => {
    // @ts-expect-error: a call is a plain fetch, so there is no payload cache.
    jsonPlaceholder('posts/1', { payloadCache: true })
    // @ts-expect-error: a call is a plain fetch, so there is no cache key.
    jsonPlaceholder('posts/1', { key: 'posts' })
    // @ts-expect-error: the endpoint decides which fetch sends the request.
    jsonPlaceholder('posts/1', { $fetch: undefined })
  })
})

describe('$petStore', () => {
  it('rejects payloadCache', () => {
    petStore('/pet/{petId}', {
      path: { petId: 1 },
      // @ts-expect-error: A call is a plain fetch, so there is no payload cache.
      payloadCache: true,
    })
  })
})

describe('useJsonPlaceholderData', () => {
  it('rejects a call-level client option', () => {
    // @ts-expect-error: the endpoint decides whether its requests skip the server proxy.
    useJsonPlaceholder('posts/1', { client: true })
  })

  it('rejects a custom $fetch and baseURL', () => {
    // @ts-expect-error: the endpoint decides which fetch sends the request.
    useJsonPlaceholder('posts/1', { $fetch: undefined })
    // @ts-expect-error: the endpoint decides where the request goes.
    useJsonPlaceholder('posts/1', { baseURL: '/elsewhere' })
  })

  it('types data as the return value of transform', () => {
    const { data } = useJsonPlaceholder('posts/1', {
      transform: (post: { title: string }) => post.title,
    })

    expectTypeOf(data.value).toEqualTypeOf<string | undefined>()
  })

  it('accepts a getter for every request option', () => {
    expectTypeOf(useJsonPlaceholder).toBeCallableWith('posts/{id}', {
      method: () => 'POST',
      path: () => ({ id: '1' }),
      query: () => ({ draft: true }),
      headers: () => ({ 'x-trace': 'abc' }),
      body: () => ({ title: 'Hello' }),
    })
  })
})

describe('usePetStoreData', () => {
  it('types data as the return value of transform', () => {
    const { data } = usePetStore('/pet/{petId}', {
      path: { petId: 1 },
      transform: pet => pet.name,
    })

    expectTypeOf(data.value).toEqualTypeOf<string | undefined>()
  })

  it('types data as the keys pick selects', () => {
    const { data } = usePetStore('/pet/{petId}', {
      path: { petId: 1 },
      pick: ['name'],
    })

    expectTypeOf(data.value).toEqualTypeOf<{ name: string } | undefined>()
  })

  it('types error as a NuxtError carrying the error response body', () => {
    const { error } = usePetStore('/user', { method: 'POST', body: {} })

    expectTypeOf(error.value).toEqualTypeOf<NuxtError<PetStoreComponents['schemas']['User']> | undefined>()
  })

  it('rejects payloadCache', () => {
    usePetStore('/pet/{petId}', {
      path: { petId: 1 },
      // @ts-expect-error: Nuxt's `getCachedData` takes the place of the payload cache.
      payloadCache: true,
    })
  })

  it('accepts a getter for the path option', () => {
    usePetStore('/pet/{petId}', {
      path: () => ({ petId: 1 }),
    })
  })
})
