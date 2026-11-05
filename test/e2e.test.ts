import type { ForeignServer } from './helpers/foreign-server'
import { fileURLToPath } from 'node:url'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import destr from 'destr'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ABSOLUTE_PATH_TEMPLATES, ESCAPING_PATHS, startForeignServer } from './helpers/foreign-server'

describe('nuxt-api-party', async () => {
  const backend = await startForeignServer()
  afterAll(() => backend.close())

  await setup({
    server: true,
    rootDir: fileURLToPath(new URL('./fixture', import.meta.url)),
    nuxtConfig: {
      apiParty: {
        endpoints: {
          backendApi: {
            url: `http://${backend.host}/base`,
            allowedUrls: [`http://${backend.host}/other`],
          },
        },
      },
    },
  })

  it('fetches data with $testApi', async () => {
    const html = await $fetch<string>('/$testApi')
    expect(getTestResult(html)).toMatchSnapshot()
  })

  it('throws error for invalid response with $testApi', async () => {
    const html = await $fetch<string>('/$testApi-error')
    expect(getTestResult(html)).toMatchSnapshot()
  })

  it('fetches data with useTestApiData', async () => {
    const html = await $fetch<string>('/useTestApiData')
    expect(getTestResult(html)).toMatchSnapshot()
  })

  it('hook doesn\'t swallow h3 errors', async () => {
    await $fetch('/api/__api_party/forbidden', {
      method: 'POST',
      body: {
        path: '/',
        method: 'GET',
      },
      ignoreResponseError: true,
      onResponse: ({ response }) => {
        expect(response.status).toBe(401)
      },
    })
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
      const response = await proxy('testApi', { path: pathTemplate.replace('{host}', foreignServer.host) })

      expect(response.status).toBe(400)
      expect(foreignServer.requestUrls).toEqual([])
    })

    it.each(ESCAPING_PATHS)('rejects %s for leaving the base path', async (path) => {
      backend.requestUrls.length = 0

      const response = await proxy('backendApi', { path })

      expect(response.status).toBe(400)
      expect(backend.requestUrls).toEqual([])
    })

    it('rejects a path leaving an -Endpoint-Url base', async () => {
      backend.requestUrls.length = 0

      const response = await proxy('backendApi', {
        path: '../base/secret',
        headers: { 'backendApi-Endpoint-Url': `http://${backend.host}/other` },
      })

      expect(response.status).toBe(400)
      expect(backend.requestUrls).toEqual([])
    })

    it('rejects a line break that ufo cuts the sent URL at', async () => {
      backend.requestUrls.length = 0

      const response = await proxy('backendApi', { path: '../secret\n/../base/articles' })

      expect(response.status).toBe(400)
      expect(backend.requestUrls).toEqual([])
    })
  })

  describe('endpoint URL override', () => {
    it('fetches from an -Endpoint-Url listed in allowedUrls', async () => {
      const response = await proxy('nestedApi', { path: '/echo-headers', headers: { 'nestedApi-Endpoint-Url': '/api' } })

      expect(response.status).toBe(200)
    })

    it('rejects an -Endpoint-Url outside allowedUrls', async () => {
      const response = await proxy('nestedApi', { path: '/echo-headers', headers: { 'nestedApi-Endpoint-Url': '/api/elsewhere' } })

      expect(response.status).toBe(400)
    })
  })
})

function proxy(endpointId: string, body: { path: string, headers?: Record<string, string> }) {
  return fetch(`/api/__api_party/${endpointId}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function getTestResult(html: string) {
  const content = html.match(/<script\s+type="text\/test-result">(.*?)<\/script>/s)?.[1]
  return destr(content)
}
