import { request } from 'node:http'
import { join } from 'node:path'
import { $fetch, fetch, setup, url } from '@nuxt/test-utils/e2e'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { ALLOWED_REQUESTS, REFUSED_REQUESTS } from './helpers/allowed-routes'
import { ABSOLUTE_PATH_TEMPLATES, AMBIGUOUS_PATHS, ESCAPING_PATHS, recordingEndpoints, startRecordingServer } from './helpers/recording-server'

describe('nuxt-api-party proxy', async () => {
  const backend = await startRecordingServer()
  beforeEach(() => {
    backend.requestUrls.length = 0
  })
  afterAll(() => backend.close())

  await setup({
    server: true,
    rootDir: join(import.meta.dirname, 'fixture'),
    nuxtConfig: {
      apiParty: {
        endpoints: recordingEndpoints(backend.host),
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
    it.each(ABSOLUTE_PATH_TEMPLATES)('rejects %s without contacting the host it names', async (pathTemplate) => {
      const path = encodeURI(pathTemplate.replace('{host}', backend.host))

      const response = await fetch(`/api/__api_party/testApi/proxy/${path}`)

      expect(response.status).toBe(400)
      expect(backend.requestUrls).toEqual([])
    })

    it.each([...ESCAPING_PATHS, ...AMBIGUOUS_PATHS])('rejects %s for leaving the base path', async (path) => {
      const status = await requestStatus(`/api/__api_party/backendApi/proxy/${path}`)

      expect(status).toBe(400)
      expect(backend.requestUrls).toEqual([])
    })

    it('rejects a path leaving an -Endpoint-Url base', async () => {
      const status = await requestStatus('/api/__api_party/backendApi/proxy/../base/secret', {
        'backendApi-Endpoint-Url': `http://${backend.host}/other`,
      })

      expect(status).toBe(400)
      expect(backend.requestUrls).toEqual([])
    })
  })

  describe('allowedRoutes', () => {
    it.each(ALLOWED_REQUESTS)('forwards %s %s', async (method, path) => {
      const status = await requestStatus(`/api/__api_party/guardedApi/proxy/${path}`, {}, method)

      expect(status).toBe(200)
      expect(backend.requestUrls).toEqual([`/base/${path}`])
    })

    it.each(REFUSED_REQUESTS)('refuses %s %s without contacting the backend', async (method, path) => {
      const status = await requestStatus(`/api/__api_party/guardedApi/proxy/${path}`, {}, method)

      expect(status).toBe(403)
      expect(backend.requestUrls).toEqual([])
    })

    it('rejects articles/../admin before matching allowedRoutes', async () => {
      const status = await requestStatus('/api/__api_party/guardedApi/proxy/articles/../admin')

      expect(status).toBe(400)
      expect(backend.requestUrls).toEqual([])
    })

    it('forwards a path below an -Endpoint-Url base', async () => {
      const status = await requestStatus('/api/__api_party/guardedApi/proxy/articles/1', {
        'guardedApi-Endpoint-Url': `http://${backend.host}/other`,
      })

      expect(status).toBe(200)
      expect(backend.requestUrls).toEqual(['/other/articles/1'])
    })

    it('refuses every request with an empty list', async () => {
      const status = await requestStatus('/api/__api_party/closedApi/proxy/articles/1')

      expect(status).toBe(403)
      expect(backend.requestUrls).toEqual([])
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

/** Sends a request with `path` as the literal request target, which `fetch` would normalize before sending. */
function requestStatus(path: string, headers: Record<string, string> = {}, method = 'GET') {
  return new Promise<number>((resolve, reject) => {
    request(url('/'), { path, method, headers }, (response) => {
      response.resume()
      resolve(response.statusCode!)
    }).on('error', reject).end()
  })
}
