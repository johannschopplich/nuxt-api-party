import type { $jsonPlaceholder, useJsonPlaceholderData } from '../playground/.nuxt/module/nuxt-api-party'
import { describe, it } from 'vitest'

declare const jsonPlaceholder: typeof $jsonPlaceholder
declare const useJsonPlaceholder: typeof useJsonPlaceholderData

describe('$jsonPlaceholder', () => {
  it('rejects a call-level client option', () => {
    // @ts-expect-error: the endpoint decides whether its requests skip the server proxy.
    jsonPlaceholder('posts/1', { client: true })
  })
})

describe('useJsonPlaceholderData', () => {
  it('rejects a call-level client option', () => {
    // @ts-expect-error: the endpoint decides whether its requests skip the server proxy.
    useJsonPlaceholder('posts/1', { client: true })
  })
})
