import type { EndpointConfiguration } from '../src/module'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { generateOpenAPITypes } from '../src/openapi'

const rootDir = join(import.meta.dirname, '..', 'playground')

const petStore: EndpointConfiguration = {
  url: 'https://example.com',
  schema: './schemas/petStore.yaml',
}

describe('generateOpenAPITypes', () => {
  it('wraps the generated types in a module declaration named after the endpoint', async () => {
    const types = await generateOpenAPITypes({ petStore }, { rootDir })

    expect(types).toContain('declare module "#nuxt-api-party/petStore"')
    expect(types).toContain('export interface paths')
  })

  it('resolves a relative schema path against rootDir', async () => {
    const types = await generateOpenAPITypes({ petStore }, { rootDir })

    expect(types).toContain('"/pet/{petId}"')
  })

  it('applies the global openAPITS options', async () => {
    const types = await generateOpenAPITypes({ petStore }, { rootDir, openAPITS: { exportType: true } })

    expect(types).toContain('export type paths')
  })

  it('lets an endpoint override a global openAPITS option', async () => {
    const types = await generateOpenAPITypes(
      { petStore: { ...petStore, openAPITS: { exportType: false } } },
      { rootDir, openAPITS: { exportType: true } },
    )

    expect(types).toContain('export interface paths')
  })

  it('skips an endpoint that declares no schema', async () => {
    const types = await generateOpenAPITypes(
      { withoutSchema: { url: 'https://example.com' } },
      { rootDir },
    )

    expect(types).toBe('')
  })

  // The dev server keeps running on a schema it cannot read, so a later save can fix it.
  it('falls back to empty paths instead of throwing on an unreadable schema', async () => {
    const types = await generateOpenAPITypes(
      { broken: { url: 'https://example.com', schema: './schemas/does-not-exist.yaml' } },
      { rootDir },
    )

    expect(types).toContain('declare module "#nuxt-api-party/broken"')
    expect(types).toContain('export type paths = Record<string, never>')
  })

  it('rejects a schema given as a function', async () => {
    await expect(generateOpenAPITypes(
      // @ts-expect-error: The option type no longer allows a function.
      { legacy: { url: 'https://example.com', schema: () => ({}) } },
      { rootDir },
    )).rejects.toThrow(/no longer accepts a function/)
  })
})
