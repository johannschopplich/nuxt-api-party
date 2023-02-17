import { fileURLToPath } from 'node:url'
import destr from 'destr'
import { describe, expect, it } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils'

describe('nuxt-api-party', async () => {
  await setup({
    server: true,
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
  })

  it('fetches data with $jsonPlaceholder', async () => {
    const html = await $fetch('/test/$jsonPlaceholder')
    expect(getTestResult(html)).toMatchSnapshot()
  })

  it('fetches data with useJsonPlaceholderData', async () => {
    const html = await $fetch('/test/useJsonPlaceholderData')
    expect(getTestResult(html)).toMatchSnapshot()
  })
})

function getTestResult(html: string) {
  const content = html.match(/<script\s+type="text\/test-result">(.*?)<\/script>/s)?.[1]
  return destr(content)
}
