import { join } from 'node:path'
import { $fetch, createPage, fetch, setup } from '@nuxt/test-utils/e2e'
import destr from 'destr'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { ALLOWED_REQUESTS, REFUSED_REQUESTS } from './helpers/allowed-routes'
import { ABSOLUTE_PATH_TEMPLATES, AMBIGUOUS_PATHS, ESCAPING_PATHS, recordingEndpoints, startRecordingServer } from './helpers/recording-server'

describe('nuxt-api-party', async () => {
  const backend = await startRecordingServer()
  beforeEach(() => {
    backend.requestUrls.length = 0
  })
  afterAll(() => backend.close())

  await setup({
    server: true,
    browser: true,
    rootDir: join(import.meta.dirname, 'fixture'),
    nuxtConfig: {
      apiParty: {
        endpoints: recordingEndpoints(backend.host),
      },
    },
  })

  describe('$testApi', () => {
    it('returns the parsed JSON body', async () => {
      const { json } = await fetchTestResult<{ json: { id: number, title: string }[] }>('/$testApi')

      expect(json).toHaveLength(3)
      expect(json[0]).toMatchObject({ id: 1, title: 'delectus aut autem' })
    })

    it('returns the decoded text of a binary response', async () => {
      const { blob } = await fetchTestResult<{ blob: string }>('/$testApi')

      expect(blob).toBe('Foo')
    })

    it('throws with the upstream error payload attached', async () => {
      const error = await fetchTestResult('/$testApi-error')

      expect(error).toMatchObject({
        statusCode: 404,
        statusMessage: 'Not Found',
        data: { reason: 'anything' },
      })
    })

    it('forwards the headers option to the API', async () => {
      const result = await fetchTestResult<{ authorization?: string, traceId?: string }>('/request-headers')

      expect(result.authorization).toBe('Bearer developer-token')
      expect(result.traceId).toBe('abc')
    })

    it('forwards the cookie only for the endpoint that sets cookies to true', async () => {
      const html = await $fetch<string>('/cookies', {
        headers: { cookie: 'session=secret' },
      })
      const result = readTestResult<{ withCookies?: string, withoutCookies?: string }>(html)

      expect(result.withCookies).toBe('session=secret')
      expect(result.withoutCookies).toBeUndefined()
    })
  })

  describe('useTestApiData', () => {
    it('applies transform to the resolved data', async () => {
      const todos = await fetchTestResult<{ isTransformed: boolean }[]>('/useTestApiData')

      expect(todos).toHaveLength(3)
      expect(todos.every(todo => todo.isTransformed)).toBe(true)
    })

    it('keeps each call site on its own transform when two request the same resource', async () => {
      const result = await fetchTestResult<{ firstTodoCount: number, firstTwoTodosCount: number }>('/auto-key')

      expect(result.firstTodoCount).toBe(1)
      expect(result.firstTwoTodosCount).toBe(2)
    })

    it('sends a single request for two call sites with the same key', async () => {
      const result = await fetchTestResult<{ firstHits: number, secondHits: number }>('/shared-key')

      expect(result.firstHits).toBeGreaterThan(0)
      expect(result.secondHits).toBe(result.firstHits)
    })

    it('fetches again on refresh instead of answering from the payload', async () => {
      const result = await fetchTestResult<{ initialHits: number, refreshedHits: number }>('/refresh')

      expect(result.refreshedHits).toBe(result.initialHits + 1)
    })

    it('fetches again on execute after clear', async () => {
      const result = await fetchTestResult<{ initialHits: number, clearedHits: number }>('/clear')

      expect(result.clearedHits).toBe(result.initialHits + 1)
    })

    it('fetches again on refresh after the query changed', async () => {
      const result = await fetchTestResult<{ changedHits: number, refreshedHits: number }>('/refresh-after-key-change')

      expect(result.refreshedHits).toBeGreaterThan(result.changedHits)
    })

    it('sends a single request when two call sites ask for the same resource', async () => {
      const result = await fetchTestResult<{ firstHits: number, secondHits: number }>('/shared-request')

      expect(result.firstHits).toBeGreaterThan(0)
      expect(result.secondHits).toBe(result.firstHits)
    })

    it('fetches again on refresh in the browser', async () => {
      const page = await createPage('/refresh-in-browser')
      const hits = page.getByTestId('hits')
      const initialHits = Number(await hits.textContent())

      await page.getByTestId('refresh').click()

      await expect.poll(() => hits.textContent()).toBe(String(initialHits + 1))
      await page.close()
    })
  })

  describe('path', () => {
    it.each(ABSOLUTE_PATH_TEMPLATES)('rejects %s without contacting the host it names', async (pathTemplate) => {
      const response = await proxy('testApi', { path: pathTemplate.replace('{host}', backend.host) })

      expect(response.status).toBe(400)
      expect(backend.requestUrls).toEqual([])
    })

    it.each([...ESCAPING_PATHS, ...AMBIGUOUS_PATHS])('rejects %s for leaving the base path', async (path) => {
      const response = await proxy('backendApi', { path })

      expect(response.status).toBe(400)
      expect(backend.requestUrls).toEqual([])
    })

    it('rejects a path leaving an -Endpoint-Url base', async () => {
      const response = await proxy('backendApi', {
        path: '../base/secret',
        headers: { 'backendApi-Endpoint-Url': `http://${backend.host}/other` },
      })

      expect(response.status).toBe(400)
      expect(backend.requestUrls).toEqual([])
    })

    it('rejects a ../secret escape hidden before a line break', async () => {
      const response = await proxy('backendApi', { path: '../secret\n/../base/articles' })

      expect(response.status).toBe(400)
      expect(backend.requestUrls).toEqual([])
    })

    it('rejects a non-string path', async () => {
      const response = await proxy('backendApi', { path: 123 as unknown as string })

      expect(response.status).toBe(400)
    })
  })

  describe('allowedRoutes', () => {
    it.each(ALLOWED_REQUESTS)('forwards %s %s', async (method, path) => {
      const response = await proxy('guardedApi', { path, method })

      expect(response.status).toBe(200)
      expect(backend.requestUrls).toEqual([`/base/${path}`])
    })

    it.each(REFUSED_REQUESTS)('refuses %s %s without contacting the backend', async (method, path) => {
      const response = await proxy('guardedApi', { path, method })

      expect(response.status).toBe(403)
      expect(backend.requestUrls).toEqual([])
    })

    it('forwards a request without a method to a GET-only route', async () => {
      const response = await proxy('guardedApi', { path: 'articles/1' })

      expect(response.status).toBe(200)
    })

    it('rejects a non-string method', async () => {
      const response = await proxy('guardedApi', { path: 'articles/1', method: 123 as unknown as string })

      expect(response.status).toBe(400)
      expect(backend.requestUrls).toEqual([])
    })

    it('forwards a path below an -Endpoint-Url base', async () => {
      const response = await proxy('guardedApi', {
        path: 'articles/1',
        headers: { 'guardedApi-Endpoint-Url': `http://${backend.host}/other` },
      })

      expect(response.status).toBe(200)
      expect(backend.requestUrls).toEqual(['/other/articles/1'])
    })

    it('refuses every request with an empty list', async () => {
      const response = await proxy('closedApi', { path: 'articles/1' })

      expect(response.status).toBe(403)
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

function proxy(endpointId: string, body: { path: string, method?: string, headers?: Record<string, string> }) {
  return fetch(`/api/__api_party/${endpointId}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function fetchTestResult<T = any>(path: string): Promise<T> {
  return readTestResult<T>(await $fetch<string>(path))
}

function readTestResult<T = any>(html: string): T {
  const content = html.match(/<script\s+type="text\/test-result">(.*?)<\/script>/s)?.[1]
  return destr(content)
}
