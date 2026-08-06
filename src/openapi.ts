import type { OpenAPI3, OpenAPITSOptions } from 'openapi-typescript'
import type { EndpointConfiguration } from './module'
import { pathToFileURL } from 'node:url'
import { useNuxt } from '@nuxt/kit'
import { isAbsolute, resolve } from 'pathe'
import { pascalCase } from 'scule'

type SchemaEndpoint = EndpointConfiguration & {
  schema: NonNullable<EndpointConfiguration['schema']>
}

export async function generateOpenAPITypes(
  endpoints: Record<string, EndpointConfiguration>,
  globalOpenAPIOptions: OpenAPITSOptions,
) {
  const resolvedSchemaEntries = await Promise.all(
    Object.entries(endpoints)
      .filter((entry): entry is [string, SchemaEndpoint] => Boolean(entry[1].schema))
      .map(async ([id, endpoint]) => {
        const types = await generateSchemaTypes({ id, endpoint, openAPITSOptions: globalOpenAPIOptions })
        return [id, types] as const
      }),
  )

  return resolvedSchemaEntries
    .map(
      ([id, types]) => `
declare module "#nuxt-api-party/${id}" {
${normalizeIndentation(types).trimEnd()}
}`.trimStart(),
    )
    .join('\n\n')
    .trimStart()
}

export function generateOpenAPITypeHelpers(id: string) {
  return `
/**
 * OpenAPI endpoint type helper for the ${pascalCase(id)} API
 *
 * @example
 * // Get path parameters for retrieving a user by ID:
 * type UserParams = ${pascalCase(id)}<'/users/{id}', 'get'>['path']
 *
 * // Get query parameters for listing users:
 * type UsersQuery = ${pascalCase(id)}<'/users', 'get'>['query']
 *
 * // Get request body type for creating a user:
 * type CreateUserBody = ${pascalCase(id)}<'/users', 'post'>['request']
 *
 * // Get success response for retrieving a user:
 * type UserResponse = ${pascalCase(id)}<'/users/{id}', 'get'>['response']
 *
 * // Get a specific status code response:
 * type UserNotFoundResponse = ${pascalCase(id)}<'/users/{id}', 'get'>['responses'][404]
 *
 * // Get complete endpoint type definition:
 * type UserEndpoint = ${pascalCase(id)}<'/users/{id}', 'get'>
 */
export type ${pascalCase(id)}<
  Path extends keyof ${pascalCase(id)}Paths,
  Method extends OpenAPIPathMethods<${pascalCase(id)}Paths, Path>
> = OpenAPIEndpoint<${pascalCase(id)}Paths, Path, Method>

/**
 * Type helper to list all available paths of the ${pascalCase(id)} API
 *
 * @example
 * type AvailablePaths = ${pascalCase(id)}ApiPaths // Returns literal union of all available paths
 */
export type ${pascalCase(id)}ApiPaths = keyof ${pascalCase(id)}Paths

/**
 * Type helper to get available methods for a specific path of the ${pascalCase(id)} API
 *
 * @example
 * type UserMethods = ${pascalCase(id)}ApiMethods<'/users/{id}'> // Returns 'get' | 'put' | 'delete' etc.
 */
export type ${pascalCase(id)}ApiMethods<Path extends keyof ${pascalCase(id)}Paths> = OpenAPIPathMethods<${pascalCase(id)}Paths, Path>

/**
 * Type helper to extract schema models from the ${pascalCase(id)} API
 *
 * @example
 * type Pet = ${pascalCase(id)}Model<'Pet'> // Get the Pet schema model
 * type User = ${pascalCase(id)}Model<'User'> // Get the User schema model
 */
export type ${pascalCase(id)}Model<T extends keyof ${pascalCase(id)}Components['schemas']> = ${pascalCase(id)}Components['schemas'][T]
`.trim()
}

async function generateSchemaTypes(options: {
  id: string
  endpoint: SchemaEndpoint
  openAPITSOptions?: OpenAPITSOptions
}) {
  // openapi-typescript < 7 does not have named exports.
  const openAPITS = await interopDefault(import('openapi-typescript'))
  const schema = await resolveSchema(options.id, options.endpoint)

  try {
    const ast = await openAPITS(schema, {
      // @ts-expect-error: openapi-typescript >= 7 dropped this option.
      commentHeader: '',
      ...options.openAPITSOptions,
      ...options.endpoint.openAPITS,
    })

    if (typeof ast !== 'string') {
      // Required for openapi-typescript v7+.
      const { astToString } = await import('openapi-typescript')
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

async function resolveSchema(id: string, { schema }: SchemaEndpoint): Promise<string | URL | OpenAPI3> {
  // `nuxt.config` is transpiled without typechecking, so a function left over
  // from before v4 reaches this unchecked and would otherwise fail as an
  // unexplained generation error.
  if (typeof schema === 'function') {
    throw new TypeError(`[nuxt-api-party] "apiParty.endpoints.${id}.schema" no longer accepts a function. Resolve the schema in the "api-party:extend" hook instead.`)
  }

  if (typeof schema === 'string') {
    if (/^https?:\/\//i.test(schema))
      return schema

    if (schema.startsWith('file://'))
      return new URL(schema)

    const nuxt = useNuxt()
    const resolvedPath = isAbsolute(schema)
      ? schema
      : resolve(nuxt.options.rootDir, schema)

    return pathToFileURL(resolvedPath)
  }

  return schema!
}

async function interopDefault<T>(
  m: T | Promise<T>,
): Promise<T extends { default: infer U } ? U : T> {
  const resolved = await m
  return (resolved as any).default || resolved
}

function normalizeIndentation(code: string): string {
  // Replace each cluster of four spaces with two spaces.
  const replacedCode = code.replace(/^( {4})+/gm, match => '  '.repeat(match.length / 4))

  // Ensure each line starts with exactly two spaces.
  const normalizedCode = replacedCode.replace(/^/gm, '  ')

  return normalizedCode
}
