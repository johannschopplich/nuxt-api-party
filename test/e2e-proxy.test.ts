import type { ForeignServer } from './helpers/foreign-server'
import { fileURLToPath } from 'node:url'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ABSOLUTE_PATH_TEMPLATES, startForeignServer } from './helpers/foreign-server'

describe('nuxt-api-party proxy', async () => {
  await setup({
    server: true,
    rootDir: fileURLToPath(new URL('./fixture', import.meta.url)),
    nuxtConfig: {
      apiParty: {
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
