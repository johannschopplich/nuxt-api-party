import { fileURLToPath } from 'node:url'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import destr from 'destr'
import { describe, expect, it } from 'vitest'

describe('nuxt-api-party', async () => {
  await setup({
    server: true,
    rootDir: fileURLToPath(new URL('./fixture', import.meta.url)),
  })

  it('fetches data with $testApi', async () => {
    const html = await $fetch<string>('/$testApi')
    expect(getTestResult(html)).toMatchSnapshot()
  })

  it('throws error for invalid response with $testApi', async () => {
    const html = await $fetch<string>('/$testApi-error')
    expect(getTestResult(html)).toMatchSnapshot()
  })

  it('fetches data with useTestApiData', async () => {
    const html = await $fetch<string>('/useTestApiData')
    expect(getTestResult(html)).toMatchSnapshot()
  })

  it('test endpoint from module module hook is added', async () => {
    // Just test if the endpoint is callable. The actual functionality is tested in unit tests.
    // If it returns a 500 error, the endpoint is not registered correctly.
    await $fetch<string>('/useTestModData')
  })
})

function getTestResult(html: string) {
  const content = html.match(/<script\s+type="text\/test-result">(.*?)<\/script>/s)?.[1]
  return destr(content)
}
