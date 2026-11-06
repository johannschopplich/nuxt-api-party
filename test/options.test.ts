import { describe, expect, it } from 'vitest'
import { assertValidOptions } from '../src/options'

describe('assertValidOptions', () => {
  it.each([
    ['server', 'nitro.apiBaseURL'],
    ['client', 'client: true'],
    ['openAPITS', 'apiful'],
    ['payloadCache', 'getCachedData'],
  ])('rejects the removed module option %s, naming %s as its replacement', (key, replacement) => {
    const message = readErrorMessage(() => assertValidOptions({ endpoints: {}, [key]: {} }))

    expect(message).toContain(`\`${key}\``)
    expect(message).toContain(replacement)
  })

  it.each([
    ['allowedUrls', 'one endpoint'],
    ['cookies', 'forwardCredentials'],
    ['openAPITS', 'apiful'],
  ])('rejects the removed endpoint option %s, naming %s as its replacement', (key, replacement) => {
    const message = readErrorMessage(() => assertValidOptions({
      endpoints: { testApi: { url: '/api', [key]: true } },
    }))

    expect(message).toContain(`\`testApi\``)
    expect(message).toContain(`\`${key}\``)
    expect(message).toContain(replacement)
  })

  it('links the migration guide', () => {
    const message = readErrorMessage(() => assertValidOptions({ endpoints: {}, server: {} }))

    expect(message).toContain('https://nuxt-api-party.byjohann.dev/advanced/migration')
  })

  it('rejects client together with forwardCredentials', () => {
    expect(() => assertValidOptions({
      endpoints: { testApi: { url: '/api', client: true, forwardCredentials: true } },
    })).toThrow('`forwardCredentials`')
  })

  it('rejects client together with allowedRoutes', () => {
    expect(() => assertValidOptions({
      endpoints: { testApi: { url: '/api', client: true, allowedRoutes: [] } },
    })).toThrow('`allowedRoutes`')
  })
})

function readErrorMessage(callback: () => void) {
  try {
    callback()
  }
  catch (error) {
    return (error as Error).message
  }
  throw new Error('Expected the callback to throw')
}
