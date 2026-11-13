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
    const { declarations } = await generateOpenAPITypes({ petStore }, { rootDir })

    expect(declarations).toContain(`declare module '#nuxt-api-party/petStore'`)
    expect(declarations).toContain('export interface paths')
  })

  it('resolves a relative schema path against rootDir', async () => {
    const { declarations } = await generateOpenAPITypes({ petStore }, { rootDir })

    expect(declarations).toContain('"/pet/{petId}"')
  })

  it('loads a schema given as a URL', async () => {
    const { declarations } = await generateOpenAPITypes(
      {
        petStore: {
          url: 'https://example.com',
          schema: pathToFileURL(join(rootDir, 'schemas/petStore.yaml')),
        },
      },
      { rootDir },
    )

    expect(declarations).toContain('"/pet/{petId}"')
  })

  it('loads a schema given as a function', async () => {
    const { declarations } = await generateOpenAPITypes(
      {
        inventory: {
          url: 'https://example.com',
          schema: async () => ({
            openapi: '3.1.0',
            info: { title: 'Inventory', version: '1.0.0' },
            paths: {
              '/items': {
                get: {
                  responses: {
                    204: { description: 'No content' },
                  },
                },
              },
            },
          }),
        },
      },
      { rootDir },
    )

    expect(declarations).toContain('"/items"')
  })

  it('emits one module declaration per endpoint', async () => {
    const { declarations } = await generateOpenAPITypes(
      { petStore, petStoreMirror: petStore },
      { rootDir },
    )

    expect(declarations).toContain(`declare module '#nuxt-api-party/petStore'`)
    expect(declarations).toContain(`declare module '#nuxt-api-party/petStoreMirror'`)
  })

  it('indents the declaration body by two spaces', async () => {
    const { declarations } = await generateOpenAPITypes({ petStore }, { rootDir })

    expect(declarations).toContain('\n  export interface paths {\n    "/pet": {')
  })

  it('skips an endpoint that declares no schema', async () => {
    const { declarations } = await generateOpenAPITypes(
      {
        withoutSchema: { url: 'https://example.com' },
      },
      { rootDir },
    )

    expect(declarations).toBe('')
  })

  // The dev server keeps running on a schema it cannot read, so a later save can fix it.
  it('falls back to empty paths instead of throwing on an unreadable schema', async () => {
    const { declarations } = await generateOpenAPITypes(
      {
        broken: { url: 'https://example.com', schema: './schemas/does-not-exist.yaml' },
      },
      { rootDir },
    )

    expect(declarations).toContain(`declare module '#nuxt-api-party/broken'`)
    expect(declarations).toContain('export type paths = Record<string, never>')
  })
})
