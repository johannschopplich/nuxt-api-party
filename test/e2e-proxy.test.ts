import { fileURLToPath } from 'node:url'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

describe('nuxt-api-party proxy', async () => {
  await setup({
    server: true,
    rootDir: fileURLToPath(new URL('./fixture', import.meta.url)),
    nuxtConfig: {
      apiParty: {
        experimental: {
          enablePrefixedProxy: true,
        },
      },
    },
  })

  function echoHeaders(endpointId: string, headers: Record<string, string>) {
    return $fetch<Record<string, string>>(
      `/api/__api_party/${endpointId}/proxy/echo-headers`,
      { headers },
    )
  }

  it('surfaces an h3 error thrown from a request hook', async () => {
    await $fetch('/api/__api_party/forbidden/proxy/', {
      ignoreResponseError: true,
      onResponse: ({ response }) => {
        expect(response.status).toBe(401)
      },
    })
  })

  it('withholds the cookie from an endpoint that leaves cookies unset', async () => {
    const received = await echoHeaders('testApi', { cookie: 'session=secret' })

    expect(received.cookie).toBeUndefined()
  })

  it('forwards the cookie to an endpoint that sets cookies to true', async () => {
    const received = await echoHeaders('cookieApi', { cookie: 'session=secret' })

    expect(received.cookie).toBe('session=secret')
  })

  it('withholds authorization from every endpoint', async () => {
    const received = await echoHeaders('cookieApi', { authorization: 'Bearer client-token' })

    expect(received.authorization).toBeUndefined()
  })

  it('passes an unremarkable header through', async () => {
    const received = await echoHeaders('testApi', { 'x-trace-id': 'abc' })

    expect(received['x-trace-id']).toBe('abc')
  })
})
