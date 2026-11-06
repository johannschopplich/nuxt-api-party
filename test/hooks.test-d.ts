// The assertions run against the playground's build output, since only a build with endpoints could declare a
// per-endpoint hook.
/// <reference path="../playground/.nuxt/module/nuxt-api-party.hooks.d.ts" />

import type { NitroRuntimeHooks } from 'nitropack/types'
import type { RuntimeNuxtHooks } from '#app'
import { describe, expectTypeOf, it } from 'vitest'

describe('RuntimeNuxtHooks', () => {
  it('declares no per-endpoint hook', () => {
    expectTypeOf<RuntimeNuxtHooks>().not.toHaveProperty('api-party:request:jsonPlaceholder')
    expectTypeOf<RuntimeNuxtHooks>().not.toHaveProperty('api-party:response:jsonPlaceholder')
  })

  it('passes the endpoint ID to api-party:request and api-party:response', () => {
    expectTypeOf<Parameters<RuntimeNuxtHooks['api-party:request']>[1]>().toEqualTypeOf<string>()
    expectTypeOf<Parameters<RuntimeNuxtHooks['api-party:response']>[1]>().toEqualTypeOf<string>()
  })
})

describe('NitroRuntimeHooks', () => {
  it('declares no per-endpoint hook', () => {
    expectTypeOf<NitroRuntimeHooks>().not.toHaveProperty('api-party:request:jsonPlaceholder')
    expectTypeOf<NitroRuntimeHooks>().not.toHaveProperty('api-party:response:jsonPlaceholder')
  })

  it('passes the endpoint ID to api-party:request and api-party:response', () => {
    expectTypeOf<Parameters<NitroRuntimeHooks['api-party:request']>[2]>().toEqualTypeOf<string>()
    expectTypeOf<Parameters<NitroRuntimeHooks['api-party:response']>[2]>().toEqualTypeOf<string>()
  })
})
