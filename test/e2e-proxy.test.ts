import { fileURLToPath } from 'node:url'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

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

  describe('redirect rewriting', () => {
    it.each([
      ['protocol', 'https://jsonplaceholder.typicode.com/todos'],
      ['relative', 'todos'],
      ['absolute', '/api/__api_party/testApi/proxy/todos'],
      ['external', '/api/__api_party/testApi/proxy/todos'],
    ])(`%s redirect is rewritten`, async (mode, location) => {
      const response = await fetch(`/api/__api_party/testApi/proxy/redirect?mode=${mode}`, {
        redirect: 'manual',
      })
      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe(location)
    })

    it('throws error for redirect outside of proxied path', async () => {
      const response = await fetch('/api/__api_party/testApi/proxy/redirect?mode=outside', {
        redirect: 'manual',
      })
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.message).toBe('Cannot rewrite redirect \'/\' as it is outside of the endpoint base URL.')
    })
  })
})
