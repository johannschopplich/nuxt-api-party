import { join } from 'node:path'
import { loadNuxt } from '@nuxt/kit'
import { describe, expect, it } from 'vitest'

describe('module setup', () => {
  it('rejects the cookies option of an endpoint from runtimeConfig', async () => {
    const nuxt = loadNuxt({
      cwd: join(import.meta.dirname, 'fixture'),
      overrides: {
        runtimeConfig: {
          // @ts-expect-error: The endpoint option was removed in 5.0.
          apiParty: { endpoints: { legacyApi: { url: '/api', cookies: true } } },
        },
      },
    })

    await expect(nuxt).rejects.toThrow('The `cookies` option of the endpoint `legacyApi` was removed.')
  })
})
