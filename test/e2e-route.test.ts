import { join } from 'node:path'
import { $fetch, createPage, setup } from '@nuxt/test-utils/e2e'
import destr from 'destr'
import { describe, expect, it } from 'vitest'

describe('nuxt-api-party route', async () => {
  await setup({
    server: true,
    browser: true,
    rootDir: join(import.meta.dirname, 'fixture'),
    nuxtConfig: {
      app: {
        baseURL: '/app/',
      },
      nitro: {
        apiBaseURL: '/rest',
      },
      apiParty: {
        endpoints: {
          testApi: { url: '/rest' },
        },
      },
    },
  })

  it('serves the proxy below nitro.apiBaseURL', async () => {
    const todos = await $fetch<unknown[]>('/app/rest/__api_party/testApi/todos')

    expect(todos).toHaveLength(3)
  })

  it('forwards a percent-encoded path below app.baseURL as the client sent it', async () => {
    const { url } = await $fetch<{ url: string }>('/app/rest/__api_party/testApi/echo-url/a%3Fb/')

    expect(url).toBe('/app/rest/echo-url/a%3Fb/')
  })

  it('sends a $testApi call through the proxy below app.baseURL and nitro.apiBaseURL', async () => {
    const { json } = await fetchTestResult<{ json: unknown[] }>('/app/$testApi')

    expect(json).toHaveLength(3)
  })

  it('sends a client endpoint request to the endpoint URL as written, outside app.baseURL', async () => {
    const page = await createPage('/app/client-endpoint-request-in-browser')
    const request = page.waitForRequest(request => request.url().includes('/todos'))

    await page.getByTestId('request').click()

    expect(new URL((await request).url()).pathname).toBe('/api/todos')
    await page.close()
  })
})

async function fetchTestResult<T = any>(path: string): Promise<T> {
  const html = await $fetch<string>(path)
  return destr(html.match(/<script\s+type="text\/test-result">(.*?)<\/script>/s)?.[1])
}
