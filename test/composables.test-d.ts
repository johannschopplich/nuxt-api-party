import type { $jsonPlaceholder, useJsonPlaceholderData } from '../playground/.nuxt/module/nuxt-api-party'
import { describe, it } from 'vitest'

declare const jsonPlaceholder: typeof $jsonPlaceholder
declare const useJsonPlaceholder: typeof useJsonPlaceholderData

describe('$jsonPlaceholder', () => {
  it('rejects a call-level client option', () => {
    // @ts-expect-error: the endpoint decides whether its requests skip the server proxy.
    jsonPlaceholder('posts/1', { client: true })
  })

  it('rejects the payload cache options and a custom $fetch', () => {
    // @ts-expect-error: a call is a plain fetch, so there is no payload cache.
    jsonPlaceholder('posts/1', { payloadCache: true })
    // @ts-expect-error: a call is a plain fetch, so there is no cache key.
    jsonPlaceholder('posts/1', { key: 'posts' })
    // @ts-expect-error: the endpoint decides which fetch sends the request.
    jsonPlaceholder('posts/1', { $fetch: undefined })
  })
})

describe('useJsonPlaceholderData', () => {
  it('rejects a call-level client option', () => {
    // @ts-expect-error: the endpoint decides whether its requests skip the server proxy.
    useJsonPlaceholder('posts/1', { client: true })
  })
})
