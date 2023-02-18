import { fileURLToPath } from 'node:url'
import destr from 'destr'
import { describe, expect, it } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils'

describe('nuxt-api-party', async () => {
  await setup({
    server: true,
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
  })

  it('fetches data with $testApi', async () => {
    const html = await $fetch('/test/$testApi')
    expect(getTestResult(html)).toMatchSnapshot()
  })

  it('fetches data with useTestApiData', async () => {
    const html = await $fetch('/test/useTestApiData')
    expect(getTestResult(html)).toMatchSnapshot()
  })

  it('throws error for invalid response', async () => {
    const html = await $fetch('/test/invalid')
    expect(getTestResult(html)).toMatchSnapshot()
  })
})

function getTestResult(html: string) {
  const content = html.match(/<script\s+type="text\/test-result">(.*?)<\/script>/s)?.[1]
  return destr(content)
}
