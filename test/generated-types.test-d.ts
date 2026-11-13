// The assertions run against the fixture's build output, which declares an endpoint with an unset `schema`,
// one whose `schema` fails to load and one whose `schema` comes from the runtime config.
/// <reference path="./fixture/.nuxt/module/nuxt-api-party.schema.d.ts" />

import type { ApiClient } from '../src/runtime/composables/$api'
import type { $brokenSchemaApi, $runtimeSchemaApi, $unsetSchemaApi } from './fixture/.nuxt/module/nuxt-api-party'
import type { $brokenSchemaApi as $serverBrokenSchemaApi } from './fixture/.nuxt/module/nuxt-api-party.nitro'
import { describe, expectTypeOf, it } from 'vitest'

declare const runtimeSchemaApi: typeof $runtimeSchemaApi

describe('$unsetSchemaApi', () => {
  it('types an endpoint with schema set to undefined as an ApiClient', () => {
    expectTypeOf<typeof $unsetSchemaApi>().toEqualTypeOf<ApiClient>()
  })
})

describe('$brokenSchemaApi', () => {
  it('types an endpoint whose schema fails to load as an ApiClient', () => {
    expectTypeOf<typeof $brokenSchemaApi>().toEqualTypeOf<ApiClient>()
    expectTypeOf<typeof $serverBrokenSchemaApi>().toEqualTypeOf<ApiClient>()
  })
})

describe('$runtimeSchemaApi', () => {
  it('types the response from a schema set in the runtime config', () => {
    expectTypeOf(runtimeSchemaApi('/todos')).resolves.toEqualTypeOf<{ id: number }[]>()
  })
})
