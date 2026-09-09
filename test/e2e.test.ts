import type { ForeignServer } from './helpers/foreign-server'
import { fileURLToPath } from 'node:url'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import destr from 'destr'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ABSOLUTE_PATH_TEMPLATES, startForeignServer } from './helpers/foreign-server'

describe('nuxt-api-party', async () => {
  await setup({
    server: true,
    rootDir: fileURLToPath(new URL('./fixture', import.meta.url)),
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
