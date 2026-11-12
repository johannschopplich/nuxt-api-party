import { request } from 'node:http'
import { join } from 'node:path'
import { fetch, setup, url } from '@nuxt/test-utils/e2e'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { ALLOWED_REQUESTS, REFUSED_REQUESTS } from './helpers/allowed-routes'
import { ABSOLUTE_PATH_TEMPLATES, ESCAPING_PATHS, recordingEndpoints, startRecordingServer, UPSTREAM_COOKIE, UPSTREAM_GZIP_BODY, UPSTREAM_REDIRECT_LOCATION } from './helpers/recording-server'

describe('nuxt-api-party proxy', async () => {
  const backend = await startRecordingServer()
  beforeEach(() => {
    backend.requests.length = 0
    backend.abandonedUrls.length = 0
  })
  afterAll(() => backend.close())

  await setup({
    server: true,
    rootDir: join(import.meta.dirname, 'fixture'),
    nuxtConfig: {
      apiParty: {
        endpoints: recordingEndpoints(backend.host),
      },
    },
  })

  it('answers 404 for constructor, which only the object prototype defines', async () => {
    const response = await fetch('/api/__api_party/constructor')

    expect(response.status).toBe(404)
  })

  it('surfaces an h3 error thrown from a request hook', async () => {
    const response = await fetch('/api/__api_party/forbidden')

    expect(response.status).toBe(401)
  })

  it('passes the endpoint ID to the api-party:request and api-party:response hooks', async () => {
    const response = await fetch('/api/__api_party/backendApi/articles')

    expect(backend.requests[0]!.headers['x-nitro-endpoint-id']).toBe('backendApi')
    expect(response.headers.get('x-nitro-endpoint-id')).toBe('backendApi')
  })

  it('lets the endpoint token and headers replace the incoming ones, while the incoming query wins', async () => {
    await fetch('/api/__api_party/tokenApi/articles?tenant=b', {
      headers: { 'authorization': 'Bearer visitor-token', 'x-endpoint': 'visitor' },
    })

    const [received] = backend.requests
    expect(received!.url).toBe('/base/articles?tenant=b&locale=en')
    expect(received!.headers.authorization).toBe('Bearer endpoint-token')
    expect(received!.headers['x-endpoint']).toBe('endpoint')
  })

  it('sets x-forwarded-for to the client address', async () => {
    await fetch('/api/__api_party/backendApi/articles')

    expect(backend.requests[0]!.headers['x-forwarded-for']).toBe('127.0.0.1')
  })

  it('drops a header that the incoming connection header names', async () => {
    await requestStatus('/api/__api_party/backendApi/articles', { 'connection': 'x-hop', 'x-hop': '1', 'x-kept': '1' })

    const { headers } = backend.requests[0]!
    expect(headers['x-hop']).toBeUndefined()
    expect(headers['x-kept']).toBe('1')
  })

  it('withholds te and accept-encoding from the API', async () => {
    await requestStatus('/api/__api_party/backendApi/articles', { 'te': 'trailers', 'accept-encoding': 'identity' })

    const { headers } = backend.requests[0]!
    expect(headers.te).toBeUndefined()
    expect(headers['accept-encoding']).not.toBe('identity')
  })

  it('passes a compressed response back decoded and without content-encoding', async () => {
    const response = await fetch('/api/__api_party/backendApi/gzip')

    expect(response.headers.get('content-encoding')).toBeNull()
    expect(await response.text()).toBe(UPSTREAM_GZIP_BODY)
  })

  it('answers a HEAD request with the status of the API', async () => {
    const status = await requestStatus('/api/__api_party/backendApi/articles', {}, 'HEAD')

    expect(status).toBe(200)
    expect(backend.requests[0]!.method).toBe('HEAD')
  })

  it('answers 502 for an API it cannot reach', async () => {
    const response = await fetch('/api/__api_party/unreachableApi/articles')

    expect(response.status).toBe(502)
  })

  it('forwards a multipart upload as it stands', async () => {
    const formData = new FormData()
    formData.append('file', new Blob(['Hello, upload']), 'hello.txt')

    await fetch('/api/__api_party/backendApi/upload', { method: 'POST', body: formData })

    const [received] = backend.requests
    expect(received!.method).toBe('POST')
    expect(received!.headers['content-type']).toMatch(/^multipart\/form-data; boundary=/)
    expect(received!.body).toContain('filename="hello.txt"')
    expect(received!.body).toContain('Hello, upload')
  })

  it('passes an upstream redirect back without following it', async () => {
    const response = await fetch('/api/__api_party/backendApi/redirect', { redirect: 'manual' })

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe(UPSTREAM_REDIRECT_LOCATION)
    expect(backend.requestUrls).toEqual(['/base/redirect'])
  })

  it.each([
    ['', {}],
    [' under a timeout a request hook sets', { 'x-hook-timeout': '60000' }],
  ])('stops waiting for the API once the client is gone%s', async (_, headers) => {
    const abortController = new AbortController()
    const response = fetch('/api/__api_party/backendApi/hang', { headers, signal: abortController.signal })
    await expect.poll(() => backend.requestUrls).toEqual(['/base/hang'])

    abortController.abort()

    await response.catch(() => {})
    await expect.poll(() => backend.abandonedUrls).toEqual(['/base/hang'])
  })

  it('stops reading a streamed response once the client is gone', async () => {
    const abortController = new AbortController()
    const response = await fetch('/api/__api_party/backendApi/stream', { signal: abortController.signal })
    await response.body!.getReader().read()

    abortController.abort()

    await expect.poll(() => backend.abandonedUrls).toEqual(['/base/stream'])
  })

  it('answers 502 once the timeout a request hook sets runs out', async () => {
    const response = await fetch('/api/__api_party/backendApi/hang', { headers: { 'x-hook-timeout': '100' } })

    expect(response.status).toBe(502)
    // A GET request gets a second attempt.
    expect(backend.requestUrls).toEqual(['/base/hang', '/base/hang'])
  })

  it('answers 502 once a signal runs out that a request hook sets next to a timeout', async () => {
    const response = await fetch('/api/__api_party/backendApi/hang', {
      headers: { 'x-hook-timeout': '60000', 'x-hook-signal-timeout': '100' },
    })

    expect(response.status).toBe(502)
  })

  it('sends no request to the API for a client that left before the proxy ran', async () => {
    const abortController = new AbortController()
    const response = fetch('/api/__api_party/backendApi/articles', {
      headers: { 'x-middleware-delay': '300', 'x-hook-signal-timeout': '60000' },
      signal: abortController.signal,
    })
    setTimeout(() => abortController.abort(), 100)
    await response.catch(() => {})

    await new Promise(resolve => setTimeout(resolve, 500))

    expect(backend.requestUrls).toEqual([])
  })

  it('keeps reading a response body past the timeout a request hook sets', async () => {
    const response = await fetch('/api/__api_party/backendApi/stream', { headers: { 'x-hook-timeout': '200' } })
    const reader = response.body!.getReader()

    const readUntil = Date.now() + 600
    while (Date.now() < readUntil)
      expect((await reader.read()).done).toBe(false)

    await reader.cancel()
  })

  describe('forwardCredentials', () => {
    it('withholds the cookie and authorization from an endpoint that leaves forwardCredentials unset', async () => {
      await fetch('/api/__api_party/backendApi/articles', {
        headers: { cookie: 'session=secret', authorization: 'Bearer visitor-token' },
      })

      const { headers } = backend.requests[0]!
      expect(headers.cookie).toBeUndefined()
      expect(headers.authorization).toBeUndefined()
    })

    it('forwards the cookie and authorization to an endpoint that sets forwardCredentials to true', async () => {
      await fetch('/api/__api_party/forwardingApi/articles', {
        headers: { cookie: 'session=secret', authorization: 'Bearer visitor-token' },
      })

      const { headers } = backend.requests[0]!
      expect(headers.cookie).toBe('session=secret')
      expect(headers.authorization).toBe('Bearer visitor-token')
    })

    it('refuses a cross-site request to an endpoint that sets forwardCredentials to true', async () => {
      const response = await fetch('/api/__api_party/forwardingApi/articles', {
        headers: { 'sec-fetch-site': 'cross-site' },
      })

      expect(response.status).toBe(403)
      expect(backend.requestUrls).toEqual([])
    })

    it('forwards a cross-site request to an endpoint that leaves forwardCredentials unset', async () => {
      const response = await fetch('/api/__api_party/backendApi/articles', {
        headers: { 'sec-fetch-site': 'cross-site' },
      })

      expect(response.status).toBe(200)
      expect(backend.requestUrls).toEqual(['/base/articles'])
    })

    it('passes set-cookie back only from an endpoint that sets forwardCredentials to true', async () => {
      const withheldResponse = await fetch('/api/__api_party/backendApi/set-cookie')
      const forwardedResponse = await fetch('/api/__api_party/forwardingApi/set-cookie')

      expect(withheldResponse.headers.getSetCookie()).toEqual([])
      expect(forwardedResponse.headers.getSetCookie()).toEqual([UPSTREAM_COOKIE])
    })
  })

  describe('path', () => {
    it.each([
      ['articles/', '/base/articles/'],
      ['files/a%23b', '/base/files/a%23b'],
      ['files/a%3Fpage%3D1?page=2', '/base/files/a%3Fpage%3D1?page=2'],
      ['urn%3Aisbn%3A123', '/base/urn%3Aisbn%3A123'],
    ])('forwards %s as the client sent it', async (path, upstreamUrl) => {
      const status = await requestStatus(`/api/__api_party/backendApi/${path}`)

      expect(status).toBe(200)
      expect(backend.requestUrls).toEqual([upstreamUrl])
    })

    it.each(ABSOLUTE_PATH_TEMPLATES)('rejects %s without contacting the host it names', async (pathTemplate) => {
      const path = encodeURI(pathTemplate.replace('{host}', backend.host))

      const response = await fetch(`/api/__api_party/testApi/${path}`)

      expect(response.status).toBe(400)
      expect(backend.requestUrls).toEqual([])
    })

    it.each(ABSOLUTE_PATH_TEMPLATES)('keeps a call to %s during SSR from the host it names', async (pathTemplate) => {
      const path = pathTemplate.replace('{host}', backend.host)

      const response = await fetch(`/path-from-query?path=${encodeURIComponent(path)}`)

      // The proxy refuses the call, or the API has no such path below the endpoint URL.
      expect(await response.text()).toMatch(/"statusCode":40[04]\}/)
      expect(backend.requestUrls).toEqual([])
    })

    it.each(ESCAPING_PATHS)('rejects %s for leaving the base path', async (path) => {
      const status = await requestStatus(`/api/__api_party/backendApi/${path}`)

      expect(status).toBe(400)
      expect(backend.requestUrls).toEqual([])
    })
  })

  describe('allowedRoutes', () => {
    it.each(ALLOWED_REQUESTS)('forwards %s %s', async (method, path) => {
      const status = await requestStatus(`/api/__api_party/guardedApi/${path}`, {}, method)

      expect(status).toBe(200)
      expect(backend.requestUrls).toEqual([`/base/${path}`])
    })

    it.each(REFUSED_REQUESTS)('refuses %s %s without contacting the backend', async (method, path) => {
      const status = await requestStatus(`/api/__api_party/guardedApi/${path}`, {}, method)

      expect(status).toBe(403)
      expect(backend.requestUrls).toEqual([])
    })

    it('rejects articles/../admin before matching allowedRoutes', async () => {
      const status = await requestStatus('/api/__api_party/guardedApi/articles/../admin')

      expect(status).toBe(400)
      expect(backend.requestUrls).toEqual([])
    })

    it('refuses every request with an empty list', async () => {
      const status = await requestStatus('/api/__api_party/closedApi/articles/1')

      expect(status).toBe(403)
      expect(backend.requestUrls).toEqual([])
    })
  })

  it('fetches from the endpoint URL whatever an -Endpoint-Url header names', async () => {
    const status = await requestStatus('/api/__api_party/backendApi/articles/1', {
      'backendApi-Endpoint-Url': `http://${backend.host}/other`,
    })

    expect(status).toBe(200)
    expect(backend.requestUrls).toEqual(['/base/articles/1'])
  })
})

/** Sends a request with `path` as the literal request target, which `fetch` would normalize before sending. */
function requestStatus(path: string, headers: Record<string, string> = {}, method = 'GET') {
  return new Promise<number>((resolve, reject) => {
    request(url('/'), { path, method, headers }, (response) => {
      response.resume()
      resolve(response.statusCode!)
    }).on('error', reject).end()
  })
}
