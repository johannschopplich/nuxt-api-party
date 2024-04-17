import { resolve } from 'pathe'
import { useNuxt } from '@nuxt/kit'
import type { OpenAPI3, OpenAPITSOptions } from 'openapi-typescript'
import type { ApiEndpoint } from './module'

export async function generateDeclarationTypes(
  endpoints: Record<string, ApiEndpoint>,
  globalOpenAPIOptions: OpenAPITSOptions,
) {
  const schemas = await generateSchemas(endpoints, globalOpenAPIOptions)

  return `
${Object.entries(schemas).map(([id, types]) => `
declare module '#nuxt-api-party/${id}' {
  ${types.replace(/^/gm, '  ').trimEnd()}
}`.trimStart(),
).join('\n\n')}
`.trimStart()
}

async function generateSchemas(
  endpoints: Record<string, ApiEndpoint>,
  openAPITSOptions?: OpenAPITSOptions,
) {
  const schemas = await Promise.all(
    Object.entries(endpoints)
      .filter(([, endpoint]) => Boolean(endpoint.schema))
      .map(async ([id, endpoint]) => {
        const types = await generateTypes({ id, endpoint, openAPITSOptions })
        return [id, types] as const
      }),
  )

  return Object.fromEntries(schemas)
}

async function generateTypes(options: {
  id: string
  endpoint: ApiEndpoint
  openAPITSOptions?: OpenAPITSOptions
},
) {
  const { default: openAPITS, astToString } = await import('openapi-typescript')
  const schema = await resolveSchema(options.endpoint)

  try {
    const ast = await openAPITS(schema, {
      ...options.openAPITSOptions,
      ...options.endpoint.openAPITS,
    })
    return astToString(ast)
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
