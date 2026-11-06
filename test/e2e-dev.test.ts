import { join } from 'node:path'
import { createPage, setup, url } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

describe('nuxt-api-party in development', async () => {
  await setup({
    dev: true,
    browser: true,
    rootDir: join(import.meta.dirname, 'fixture'),
  })

  describe('$testApi', () => {
    it('warns once when called during hydration, naming useTestApiData', async () => {
      const page = await createPage()
      const warnings: string[] = []
      page.on('console', (message) => {
        if (message.type() === 'warning')
          warnings.push(message.text())
      })

      await page.goto(url('/hydration-request'), { waitUntil: 'hydration' })

      const hydrationWarnings = warnings.filter(warning => warning.includes('[nuxt-api-party]'))
      expect(hydrationWarnings).toHaveLength(1)
      expect(hydrationWarnings[0]).toContain('useTestApiData')
      await page.close()
    })
  })
})
