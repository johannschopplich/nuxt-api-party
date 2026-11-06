import type { ForeignServer } from './helpers/foreign-server'
import { request } from 'node:http'
import { fileURLToPath } from 'node:url'
import { $fetch, fetch, setup, url } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ABSOLUTE_PATH_TEMPLATES, AMBIGUOUS_PATHS, ESCAPING_PATHS, startForeignServer } from './helpers/foreign-server'

describe('nuxt-api-party proxy', async () => {
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
        experimental: {
          enablePrefixedProxy: true,
        },
      },
    },
  })

  it('hook doesn\'t swallow h3 errors', async () => {
    await $fetch('/api/__api_party/forbidden/proxy/', {
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

    // The router hands the handler the path still percent-encoded, so an encoded
    // leading space such as `%C2%A0http://` never parses as a scheme and answers 404.
    it.each(ABSOLUTE_PATH_TEMPLATES.filter(template => !/^\s/.test(template)))('rejects %s without contacting the host it names', async (pathTemplate) => {
      const path = encodeURI(pathTemplate.replace('{host}', foreignServer.host))

      const response = await fetch(`/api/__api_party/testApi/proxy/${path}`)

      expect(response.status).toBe(400)
      expect(foreignServer.requestUrls).toEqual([])
    })

    it.each([...ESCAPING_PATHS, ...AMBIGUOUS_PATHS])('rejects %s for leaving the base path', async (path) => {
      backend.requestUrls.length = 0

      const status = await requestStatus(`/api/__api_party/backendApi/proxy/${path}`)

      expect(status).toBe(400)
      expect(backend.requestUrls).toEqual([])
    })

    it('rejects a path leaving an -Endpoint-Url base', async () => {
      backend.requestUrls.length = 0

      const status = await requestStatus('/api/__api_party/backendApi/proxy/../base/secret', {
        'backendApi-Endpoint-Url': `http://${backend.host}/other`,
      })

      expect(status).toBe(400)
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

/** Sends a GET with `path` as the literal request target, which `fetch` would normalize before sending. */
function requestStatus(path: string, headers: Record<string, string> = {}) {
  return new Promise<number>((resolve, reject) => {
    request(url('/'), { path, headers }, (response) => {
      response.resume()
      resolve(response.statusCode!)
    }).on('error', reject).end()
  })
}
