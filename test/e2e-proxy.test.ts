import type { ForeignServer } from './helpers/foreign-server'
import { join } from 'node:path'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ABSOLUTE_PATH_TEMPLATES, startForeignServer } from './helpers/foreign-server'

describe('nuxt-api-party proxy', async () => {
  await setup({
    server: true,
    rootDir: join(import.meta.dirname, 'fixture'),
    nuxtConfig: {
      apiParty: {
        server: {
          proxyMode: 'passthrough',
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

  it('withholds authorization even from an endpoint that forwards cookies', async () => {
    const received = await echoHeaders('cookieApi', { authorization: 'Bearer client-token' })

    expect(received.authorization).toBeUndefined()
  })

  describe('path', () => {
    let foreignServer: ForeignServer

    beforeAll(async () => {
      foreignServer = await startForeignServer()
      return () => foreignServer.close()
    })

    beforeEach(() => {
      foreignServer.requestUrls.length = 0
    })

    it.each(ABSOLUTE_PATH_TEMPLATES)('rejects %s without contacting the host it names', async (pathTemplate) => {
      const path = encodeURI(pathTemplate.replace('{host}', foreignServer.host))

      const response = await fetch(`/api/__api_party/testApi/proxy/${path}`)

      expect(response.status).toBe(400)
      expect(foreignServer.requestUrls).toEqual([])
    })
  })

  describe('endpoint URL override', () => {
    it('fetches from an -Endpoint-Url listed in allowedUrls', async () => {
      const response = await fetch('/api/__api_party/nestedApi/proxy/echo-headers', {
        headers: { 'nestedApi-Endpoint-Url': '/api' },
      })

      expect(response.status).toBe(200)
    })
  })
})
