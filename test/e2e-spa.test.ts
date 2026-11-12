import { join } from 'node:path'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

describe('nuxt-api-party (SSR disabled)', async () => {
  await setup({
    server: true,
    rootDir: join(import.meta.dirname, 'fixture'),
    nuxtConfig: {
      ssr: false,
      apiParty: {
        endpoints: {
          proxiedApi: { url: '/api', client: false },
          guardedApi: { url: '/api', allowedRoutes: [{ path: 'todos' }] },
        },
      },
    },
  })

  it('makes every endpoint a client endpoint that sets neither client to false nor forwardCredentials nor allowedRoutes', async () => {
    const endpoints = await $fetch<Record<string, unknown>>('/api/public-runtime-endpoints')

    expect(Object.keys(endpoints).sort()).toEqual([
      'clientApi',
      'forbidden',
      'runtimeSchemaApi',
      'schemaApi',
      'testApi',
      'unsetSchemaApi',
      'urlOnlyClientApi',
      'valueOf',
    ])
  })
})
