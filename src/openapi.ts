import type { OpenAPITSOptions } from 'openapi-typescript'
import type { EndpointConfiguration } from './module'
import { generateSchemaTypes } from 'apiful/openapi'
import { logger } from './kit'

type SchemaEndpoint = EndpointConfiguration & {
  schema: NonNullable<EndpointConfiguration['schema']>
}

export interface OpenAPITypesOptions {
  /** Directory a relative schema path resolves against. */
  rootDir: string
  openAPITS?: OpenAPITSOptions
}

/** Stand-in for a schema that could not be read, so the rest of the type generation still compiles. */
const EMPTY_SCHEMA_TYPES = `
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

export async function generateOpenAPITypes(
  endpoints: Record<string, EndpointConfiguration>,
  options: OpenAPITypesOptions,
): Promise<string> {
  const resolvedSchemaEntries = await Promise.all(
    Object.entries(endpoints)
      .filter((entry): entry is [string, SchemaEndpoint] => Boolean(entry[1].schema))
      .map(async ([id, endpoint]) => {
        const types = await generateEndpointTypes(id, endpoint, options)
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

async function generateEndpointTypes(
  id: string,
  endpoint: SchemaEndpoint,
  options: OpenAPITypesOptions,
): Promise<string> {
  // `nuxt.config` is transpiled without typechecking, so a function left over
  // from before v4 reaches this unchecked and would otherwise fail as an
  // unexplained generation error.
  if (typeof endpoint.schema === 'function') {
    throw new TypeError(`[nuxt-api-party] "apiParty.endpoints.${id}.schema" no longer accepts a function. Resolve the schema in the "api-party:extend" hook instead.`)
  }

  try {
    return await generateSchemaTypes({
      id,
      service: {
        schema: endpoint.schema,
        openAPITS: endpoint.openAPITS,
      },
      openAPITSOptions: options.openAPITS,
      rootDir: options.rootDir,
    })
  }
  catch (error) {
    logger.error(`Failed to generate types for ${id}`, error)
    return EMPTY_SCHEMA_TYPES
  }
}

function normalizeIndentation(code: string): string {
  // Replace each cluster of four spaces with two spaces.
  const replacedCode = code.replace(/^( {4})+/gm, match => '  '.repeat(match.length / 4))

  // Ensure each line starts with exactly two spaces.
  const normalizedCode = replacedCode.replace(/^/gm, '  ')

  return normalizedCode
}
