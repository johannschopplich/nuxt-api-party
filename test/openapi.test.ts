import type { EndpointConfiguration } from '../src/module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
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

    expect(types).toContain(`declare module '#nuxt-api-party/petStore'`)
    expect(types).toContain('export interface paths')
  })

  it('resolves a relative schema path against rootDir', async () => {
    const types = await generateOpenAPITypes({ petStore }, { rootDir })

    expect(types).toContain('"/pet/{petId}"')
  })

  it('loads a schema given as a URL', async () => {
    const types = await generateOpenAPITypes(
      { petStore: { url: 'https://example.com', schema: pathToFileURL(join(rootDir, 'schemas/petStore.yaml')) } },
      { rootDir },
    )

    expect(types).toContain('"/pet/{petId}"')
  })

  it('loads a schema given as a function', async () => {
    const types = await generateOpenAPITypes(
      {
        inventory: {
          url: 'https://example.com',
          schema: async () => ({
            openapi: '3.1.0',
            info: { title: 'Inventory', version: '1.0.0' },
            paths: { '/items': { get: { responses: { 204: { description: 'No content' } } } } },
          }),
        },
      },
      { rootDir },
    )

    expect(types).toContain('"/items"')
  })

  it('emits one module declaration per endpoint', async () => {
    const types = await generateOpenAPITypes(
      { petStore, petStoreMirror: petStore },
      { rootDir },
    )

    expect(types).toContain(`declare module '#nuxt-api-party/petStore'`)
    expect(types).toContain(`declare module '#nuxt-api-party/petStoreMirror'`)
  })

  it('indents the declaration body by two spaces', async () => {
    const types = await generateOpenAPITypes({ petStore }, { rootDir })

    expect(types).toContain('\n  export interface paths {\n    "/pet": {')
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

    expect(types).toContain(`declare module '#nuxt-api-party/broken'`)
    expect(types).toContain('export type paths = Record<string, never>')
  })
})
