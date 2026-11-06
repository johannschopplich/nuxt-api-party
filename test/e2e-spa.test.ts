import { join } from 'node:path'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

describe('nuxt-api-party without SSR', async () => {
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

  it('makes an endpoint without client a client endpoint', async () => {
    const endpoints = await $fetch<Record<string, unknown>>('/api/public-runtime-endpoints')

    expect(endpoints).toHaveProperty('testApi')
  })

  it('keeps an endpoint with client set to false on the server proxy', async () => {
    const endpoints = await $fetch<Record<string, unknown>>('/api/public-runtime-endpoints')

    expect(endpoints).not.toHaveProperty('proxiedApi')
  })

  it('keeps an endpoint that sets forwardCredentials or allowedRoutes on the server proxy', async () => {
    const endpoints = await $fetch<Record<string, unknown>>('/api/public-runtime-endpoints')

    expect(endpoints).not.toHaveProperty('credentialsApi')
    expect(endpoints).not.toHaveProperty('guardedApi')
  })
})
