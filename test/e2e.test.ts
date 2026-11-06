import { join } from 'node:path'
import { $fetch, createPage, setup } from '@nuxt/test-utils/e2e'
import destr from 'destr'
import { describe, expect, it } from 'vitest'

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

    it('forwards a Headers instance passed as the headers option to the API', async () => {
      const result = await fetchTestResult<{ traceId?: string }>('/request-headers')

      expect(result.traceId).toBe('abc')
    })

    it('forwards headers that an onRequest interceptor and an api-party:request hook set', async () => {
      const result = await fetchTestResult<{ interceptorHeader?: string, hookHeader?: string }>('/hook-headers')

      expect(result.interceptorHeader).toBe('interceptor')
      expect(result.hookHeader).toBe('hook')
    })

    it('passes the endpoint ID to the api-party:request and api-party:response hooks', async () => {
      const result = await fetchTestResult<{ requestHookEndpointId?: string, responseHookEndpointId?: string }>('/hook-headers')

      expect(result.requestHookEndpointId).toBe('testApi')
      expect(result.responseHookEndpointId).toBe('testApi')
    })

    it('forwards the cookie only for the endpoint that sets forwardCredentials to true', async () => {
      const html = await $fetch<string>('/cookies', {
        headers: { cookie: 'session=secret' },
      })
      const result = readTestResult<{ withCookies?: string, withoutCookies?: string }>(html)

      expect(result.withCookies).toBe('session=secret')
      expect(result.withoutCookies).toBeUndefined()
    })

    it('forwards the cookie while rendering a page a cross-site link opened', async () => {
      const html = await $fetch<string>('/cookies', {
        headers: { 'cookie': 'session=secret', 'sec-fetch-site': 'cross-site' },
      })

      expect(readTestResult<{ withCookies?: string }>(html).withCookies).toBe('session=secret')
    })
  })

  describe('$directApi', () => {
    it('keeps the visitor cookie off a direct request during SSR but sends the token and headers option', async () => {
      const html = await $fetch<string>('/direct-request', {
        headers: { cookie: 'session=secret' },
      })
      const result = readTestResult<{ cookie?: string, authorization?: string, traceId?: string }>(html)

      expect(result.cookie).toBeUndefined()
      expect(result.authorization).toBe('Bearer direct-token')
      expect(result.traceId).toBe('abc')
    })

    it('sends the request from the browser straight to the endpoint URL', async () => {
      const page = await createPage('/direct-request-in-browser')
      const request = page.waitForRequest(request => request.url().includes('/todos'))

      await page.getByTestId('request').click()

      expect(new URL((await request).url()).pathname).toBe('/api/todos')
      await page.close()
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

    it('sends a GET request to the proxy from the browser', async () => {
      const page = await createPage('/refresh-in-browser')
      const proxyRequest = page.waitForRequest(request => request.url().includes('/__api_party/'))

      await page.getByTestId('refresh').click()

      expect((await proxyRequest).method()).toBe('GET')
      await page.close()
    })
  })

  describe('runtimeConfig', () => {
    it('leaves the endpoint schema out', async () => {
      const endpoints = await $fetch<Record<string, Record<string, unknown>>>('/api/runtime-endpoints')

      expect(endpoints.schemaApi).toHaveProperty('url')
      expect(endpoints.schemaApi).not.toHaveProperty('schema')
    })

    it('publishes only the URL, token, query and headers of the client endpoints', async () => {
      const endpoints = await $fetch<Record<string, Record<string, unknown>>>('/api/public-runtime-endpoints')

      expect(endpoints).toEqual({
        directApi: {
          url: '/api',
          token: 'direct-token',
          query: { tenant: 'a' },
          headers: { 'x-endpoint': 'direct' },
        },
      })
    })
  })
})

async function fetchTestResult<T = any>(path: string): Promise<T> {
  return readTestResult<T>(await $fetch<string>(path))
}

function readTestResult<T = any>(html: string): T {
  const content = html.match(/<script\s+type="text\/test-result">(.*?)<\/script>/s)?.[1]
  return destr(content)
}
