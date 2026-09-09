import type { ForeignServer } from './helpers/foreign-server'
import { join } from 'node:path'
import { $fetch, createPage, fetch, setup } from '@nuxt/test-utils/e2e'
import destr from 'destr'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ABSOLUTE_PATH_TEMPLATES, startForeignServer } from './helpers/foreign-server'

describe('nuxt-api-party', async () => {
  await setup({
    server: true,
    browser: true,
    rootDir: join(import.meta.dirname, 'fixture'),
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

async function fetchTestResult<T = any>(path: string): Promise<T> {
  return readTestResult<T>(await $fetch<string>(path))
}

function readTestResult<T = any>(html: string): T {
  const content = html.match(/<script\s+type="text\/test-result">(.*?)<\/script>/s)?.[1]
  return destr(content)
}
