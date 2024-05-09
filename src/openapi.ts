import { resolve } from 'pathe'
import { useNuxt } from '@nuxt/kit'
import type { OpenAPI3, OpenAPITSOptions } from 'openapi-typescript'
import openAPITS, { astToString } from 'openapi-typescript'
import type { ApiEndpoint } from './module'

declare module 'openapi-typescript' {
  // exists in openapi-typescript@7
  function _astToString(ast: unknown): string
  export const astToString: typeof _astToString | undefined
}

export async function generateDeclarationTypes(
  endpoints: Record<string, ApiEndpoint>,
  globalOpenAPIOptions: OpenAPITSOptions,
) {
  const resolvedSchemaEntries = await Promise.all(
    Object.entries(endpoints)
      .filter(([, endpoint]) => Boolean(endpoint.schema))
      .map(async ([id, endpoint]) => {
        const types = await generateSchemaTypes({ id, endpoint, openAPITSOptions: globalOpenAPIOptions })
        return [id, types] as const
      }),
  )

  return resolvedSchemaEntries.map(([id, types]) => `
declare module '#nuxt-api-party/${id}' {
  ${types.replace(/^/gm, '  ').trimEnd()}
}`.trimStart(),
  ).join('\n\n').trimStart()
}

async function generateSchemaTypes(options: {
  id: string
  endpoint: ApiEndpoint
  openAPITSOptions?: OpenAPITSOptions
},
) {
  const schema = await resolveSchema(options.endpoint)

  try {
    const ast = await openAPITS(schema, {
      ...options.openAPITSOptions,
      ...options.endpoint.openAPITS,
    })
    if (typeof ast !== 'string') {
      // openapi-typescript 7
      return astToString!(ast)
    }
    return ast
  }
  catch (error) {
    console.error(`Failed to generate types for ${options.id}`)
    console.error(error)
    return `
export type paths = Record<string, never>
export type webhooks = Record<string, never>
export interface components {
  schemas: never
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}
export type $defs = Record<string, never>
export type operations = Record<string, never>
`.trimStart()
  }
}

async function resolveSchema({ schema }: ApiEndpoint): Promise<string | URL | OpenAPI3> {
  const nuxt = useNuxt()

  if (typeof schema === 'function')
    return await schema()

  if (typeof schema === 'string' && !isValidUrl(schema))
    return new URL(resolve(nuxt.options.rootDir, schema), import.meta.url)

  return schema!
}

function isValidUrl(url: string) {
  try {
    return Boolean(new URL(url))
  }
  catch (e) {
    return false
  }
}
