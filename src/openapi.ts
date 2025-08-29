import type { OpenAPI3, OpenAPITSOptions } from 'openapi-typescript'
import type { EndpointConfiguration } from './module'
import { useNuxt } from '@nuxt/kit'
import { resolve } from 'pathe'
import { pascalCase } from 'scule'

/** @deprecated Hooks should be used instead */
type SchemaFn = () => Promise<NonNullable<EndpointConfiguration['schema']>>

type SchemaEndpoint = EndpointConfiguration & {
  schema: NonNullable<EndpointConfiguration['schema']> | SchemaFn
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

  return resolvedSchemaEntries.map(
    ([id, types]) => `
declare module "#nuxt-api-party/${id}" {
${normalizeIndentation(types).trimEnd()}

  /** @deprecated Use \`import { ${pascalCase(id)} } from '#nuxt-api-party'\` instead */
  export type Response<
    T extends keyof operations,
    R extends keyof operations[T]['responses'] = 200 extends keyof operations[T]['responses'] ? 200 : never
  > = operations[T]['responses'][R] extends { content: { 'application/json': infer U } } ? U : never

  /** @deprecated Use \`import { ${pascalCase(id)} } from '#nuxt-api-party'\` instead */
  export type RequestBody<
    T extends keyof operations
  > = operations[T]['requestBody'] extends { content: { 'application/json': infer U } } ? U : never

  /** @deprecated Use \`import { ${pascalCase(id)} } from '#nuxt-api-party'\` instead */
  export type RequestQuery<
    T extends keyof operations
  > = operations[T]['parameters'] extends { query?: infer U } ? U : never
}`.trimStart(),
  ).join('\n\n').trimStart()
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
  Method extends PathMethods<${pascalCase(id)}Paths, Path> = PathMethods<${pascalCase(id)}Paths, Path> extends string ? PathMethods<${pascalCase(id)}Paths, Path> : never
> = {
  /** Path parameters for this endpoint */
  path: ${pascalCase(id)}Paths[Path][Method] extends { parameters?: { path?: infer P } } ? P : Record<string, never>

  /** Query parameters for this endpoint */
  query: ${pascalCase(id)}Paths[Path][Method] extends { parameters?: { query?: infer Q } } ? Q : Record<string, never>

  /** Request body for this endpoint */
  request: ${pascalCase(id)}Paths[Path][Method] extends { requestBody?: { content: { 'application/json': infer R } } } ? R : Record<string, never>

  /** Success response for this endpoint (defaults to 200 status code) */
  response: ${pascalCase(id)}Paths[Path][Method] extends { responses: infer R }
    ? 200 extends keyof R
      ? R[200] extends { content: { 'application/json': infer S } } ? S : Record<string, never>
      : Record<string, never>
    : Record<string, never>

  /** All possible responses for this endpoint by status code */
  responses: ${pascalCase(id)}Paths[Path][Method] extends { responses: infer T }
    ? {
        [Status in keyof T]:
          T[Status] extends { content: { 'application/json': infer R } }
            ? R
            : Record<string, never>
      }
    : Record<string, never>

  /** Full path with typed parameters for this endpoint (useful for route builders) */
  fullPath: Path

  /** HTTP method for this endpoint */
  method: Method

  /**
   * Full operation object for this endpoint
   *
   * @remarks
   * Useful for accessing additional metadata, such as tags or security requirements.
   */
  operation: ${pascalCase(id)}Paths[Path][Method]
}

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
export type ${pascalCase(id)}ApiMethods<P extends keyof ${pascalCase(id)}Paths> = PathMethods<${pascalCase(id)}Paths, P>

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
  // openapi-typescript < 7 does not have named exports
  const openAPITS = await interopDefault(import('openapi-typescript'))
  const schema = await resolveSchema(options.id, options.endpoint)

  try {
    const ast = await openAPITS(schema, {
      // @ts-expect-error: openapi-typescript >= 7 dropped this option
      commentHeader: '',
      ...options.openAPITSOptions,
      ...options.endpoint.openAPITS,
    })

    if (typeof ast !== 'string') {
      // Required for openapi-typescript v7+
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
  const nuxt = useNuxt()

  if (typeof schema === 'function') {
    console.warn(`[nuxt-api-party] Passing a function to "apiParty.endpoints.${id}.schema" is deprecated. Use the "api-party:extend" hook instead.`)
    return await schema()
  }

  if (typeof schema === 'string' && !isValidUrl(schema))
    return new URL(resolve(nuxt.options.rootDir, schema), import.meta.url)

  return schema!
}

function isValidUrl(url: string) {
  try {
    return Boolean(new URL(url))
  }
  catch {
    return false
  }
}

async function interopDefault<T>(
  m: T | Promise<T>,
): Promise<T extends { default: infer U } ? U : T> {
  const resolved = await m
  return (resolved as any).default || resolved
}

function normalizeIndentation(code: string): string {
  // Replace each cluster of four spaces with two spaces
  const replacedCode = code.replace(/^( {4})+/gm, match => '  '.repeat(match.length / 4))

  // Ensure each line starts with exactly two spaces
  const normalizedCode = replacedCode.replace(/^/gm, '  ')

  return normalizedCode
}
