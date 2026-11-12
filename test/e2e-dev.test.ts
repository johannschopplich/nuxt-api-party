import { join } from 'node:path'
import { createPage, setup, url } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

describe('nuxt-api-party (development)', async () => {
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

    it('stays silent when called while a page without SSR mounts', async () => {
      const page = await createPage()
      const warnings: string[] = []
      page.on('console', (message) => {
        if (message.type() === 'warning')
          warnings.push(message.text())
      })
      const response = page.waitForResponse(response => response.url().includes('/todos'))

      await page.goto(url('/hydration-request-without-ssr'), { waitUntil: 'hydration' })
      await response

      expect(warnings.filter(warning => warning.includes('[nuxt-api-party]'))).toEqual([])
      await page.close()
    })
  })
})
