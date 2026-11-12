import { join } from 'node:path'
import { $fetch, createPage, setup, url } from '@nuxt/test-utils/e2e'
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

    it('leaves the Nuxt payload empty', async () => {
      const { payloadDataKeys } = await fetchTestResult<{ payloadDataKeys: string[] }>('/$testApi')

      expect(payloadDataKeys).toEqual([])
    })

    it('throws with the upstream error payload attached', async () => {
      const error = await fetchTestResult('/$testApi-error')

      expect(error).toMatchObject({
        statusCode: 404,
        statusMessage: 'Not Found',
        data: { reason: 'anything' },
      })
    })

    it('rejects a lone surrogate path parameter instead of throwing', async () => {
      const { errorName } = await fetchTestResult<{ errorName: string }>('/$testApi-rejection')

      expect(errorName).toBe('URIError')
    })

    it('rejects .. as a path parameter', async () => {
      const { dotSegmentError } = await fetchTestResult<{ dotSegmentError: string }>('/$testApi-rejection')

      expect(dotSegmentError).toContain('Path parameter `id` is `..`')
    })

    it('sends a URLSearchParams body again when it retries a request during SSR', async () => {
      const { body } = await fetchTestResult<{ body: string }>('/form-body-retry')

      expect(body).toBe('title=Hello')
    })

    it('sends a FormData, a URLSearchParams and a Blob body with their content type during SSR', async () => {
      const { multipart, urlEncoded, binary } = await fetchTestResult<Record<'multipart' | 'urlEncoded' | 'binary', { contentType?: string, body: string }>>('/form-body')

      const boundary = multipart.contentType?.match(/^multipart\/form-data; boundary=(.+)$/)?.[1]
      expect(multipart.body).toContain(`--${boundary}`)
      expect(multipart.body).toContain('name="title"')
      expect(urlEncoded).toEqual({ contentType: 'application/x-www-form-urlencoded;charset=UTF-8', body: 'title=Hello' })
      expect(binary).toEqual({ contentType: 'text/markdown', body: 'Hello' })
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

    it('sends the visitor\'s headers but not the page request\'s own during SSR', async () => {
      const html = await $fetch<string>('/page-request-headers', {
        headers: {
          'cookie': 'session=secret',
          'authorization': 'Bearer visitor-token',
          'user-agent': 'visitor-agent',
          'accept-language': 'de',
          'if-none-match': '"page"',
          'if-modified-since': 'Wed, 01 Jan 2025 00:00:00 GMT',
          'sec-fetch-dest': 'document',
        },
      })

      expect(readTestResult(html)).toEqual({
        cookie: 'session=secret',
        authorization: 'Bearer visitor-token',
        userAgent: 'visitor-agent',
        acceptLanguage: 'de',
        forwardedFor: '127.0.0.1',
        pageTag: '/page-request-headers',
        callAcceptLanguage: 'fr',
      })
    })
  })

  describe('$clientApi', () => {
    it('keeps the visitor cookie off the request during SSR but sends the token and headers option', async () => {
      const html = await $fetch<string>('/client-endpoint-request', {
        headers: { cookie: 'session=secret' },
      })
      const result = readTestResult<{ cookie?: string, authorization?: string, traceId?: string }>(html)

      expect(result.cookie).toBeUndefined()
      expect(result.authorization).toBe('Bearer client-token')
      expect(result.traceId).toBe('abc')
    })

    it('sends the endpoint query', async () => {
      const { tenant } = await fetchTestResult<{ tenant?: string }>('/client-endpoint-request')

      expect(tenant).toBe('a')
    })

    it('sends the requests of a client endpoint that sets only its URL', async () => {
      const result = await fetchTestResult<{ requestTodoCount: number, dataTodoCount: number }>('/client-endpoint-url-only')

      expect(result).toEqual({ requestTodoCount: 3, dataTodoCount: 3 })
    })

    it('sends the request from the browser straight to the endpoint URL', async () => {
      const page = await createPage('/client-endpoint-request-in-browser')
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

    it('shares one data ref between two call sites with the same key', async () => {
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

    it.each([
      ['the path option', 'id'],
      ['a path parameter', 'id-by-parameter'],
    ])('fetches again when a getter passed as %s changes', async (_, testId) => {
      const page = await createPage('/path-getter')
      const id = page.getByTestId(testId)

      await page.getByTestId('next-id').click()

      await expect.poll(() => id.textContent()).toBe('2')
      await page.close()
    })

    it('reuses the SSR response on hydration instead of sending the request again', async () => {
      const page = await createPage()
      const proxyRequestUrls: string[] = []
      page.on('request', (request) => {
        if (request.url().includes('/__api_party/'))
          proxyRequestUrls.push(request.url())
      })

      await page.goto(url('/refresh-in-browser'), { waitUntil: 'hydration' })

      expect(proxyRequestUrls).toEqual([])
      await page.close()
    })

    it('fetches again when a getter passed as the query option changes', async () => {
      const page = await createPage('/getter-query')
      const version = page.getByTestId('version')

      await page.getByTestId('next-version').click()

      await expect.poll(() => version.textContent()).toBe('2')
      await page.close()
    })

    it('serves a repeated request from the payload through getCachedData on client navigation', async () => {
      const page = await createPage('/cached-data')
      const initialHits = await page.getByTestId('hits').textContent()
      const proxyRequestUrls: string[] = []
      page.on('request', (request) => {
        if (request.url().includes('/__api_party/'))
          proxyRequestUrls.push(request.url())
      })

      await page.getByTestId('leave').click()
      await page.getByTestId('return').click()

      await expect.poll(() => page.getByTestId('hits').textContent()).toBe(initialHits)
      expect(proxyRequestUrls).toEqual([])
      await page.close()
    })

    it('fetches again on a watch change when getCachedData serves only the initial cause', async () => {
      const page = await createPage('/cached-data')
      const hits = page.getByTestId('hits')
      const initialHits = Number(await hits.textContent())

      await page.getByTestId('revise').click()

      await expect.poll(() => hits.textContent()).toBe(String(initialHits + 1))
      await page.close()
    })
  })

  describe('useClientApiData', () => {
    it('keeps the visitor cookie off the request during SSR but sends the token and headers option', async () => {
      const html = await $fetch<string>('/client-endpoint-data', {
        headers: { cookie: 'session=secret' },
      })
      const result = readTestResult<{ cookie?: string, authorization?: string, traceId?: string }>(html)

      expect(result.cookie).toBeUndefined()
      expect(result.authorization).toBe('Bearer client-token')
      expect(result.traceId).toBe('abc')
    })

    it('sends the request from the browser straight to the endpoint URL', async () => {
      const page = await createPage()
      const request = page.waitForRequest(request => request.url().includes('/todos'))

      await page.goto(url('/client-endpoint-data-in-browser'))

      expect(new URL((await request).url()).pathname).toBe('/api/todos')
      await page.close()
    })
  })

  describe('runtimeConfig', () => {
    it('leaves the endpoint schema out', async () => {
      const endpoints = await $fetch<Record<string, Record<string, unknown>>>('/api/runtime-endpoints')

      expect(endpoints.schemaApi).toHaveProperty('url')
      expect(endpoints.schemaApi).not.toHaveProperty('schema')
      expect(endpoints.runtimeSchemaApi).toEqual({ url: '/api' })
    })

    it('publishes only the URL, token, query and headers of the client endpoints', async () => {
      const endpoints = await $fetch<Record<string, Record<string, unknown>>>('/api/public-runtime-endpoints')

      expect(endpoints).toEqual({
        clientApi: {
          url: '/api',
          token: 'client-token',
          query: { tenant: 'a' },
          headers: { 'x-endpoint': 'client', 'Authorization': 'Basic endpoint' },
        },
        // Nitro fills an unset runtime config value with an empty string.
        urlOnlyClientApi: { url: '/api', token: '', query: '', headers: '' },
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
