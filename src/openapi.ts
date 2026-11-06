import type { EndpointConfiguration } from './module'
import { declareModule, EMPTY_SCHEMA_TYPES, generateSchemaTypes, loadOpenAPIDocument } from 'apiful/openapi/generate'
import { logger } from './kit'

type SchemaEndpoint = EndpointConfiguration & {
  schema: NonNullable<EndpointConfiguration['schema']>
}

export interface OpenAPITypesOptions {
  /** Directory a relative schema path resolves against. */
  rootDir: string
}

export async function generateOpenAPITypes(
  endpoints: Record<string, EndpointConfiguration>,
  options: OpenAPITypesOptions,
): Promise<string> {
  const declarations = await Promise.all(
    Object.entries(endpoints)
      .filter((entry): entry is [string, SchemaEndpoint] => Boolean(entry[1].schema))
      .map(async ([id, endpoint]) => declareModule(`#nuxt-api-party/${id}`, await generateEndpointTypes(id, endpoint, options))),
  )

  return declarations.join('\n')
}

async function generateEndpointTypes(
  id: string,
  endpoint: SchemaEndpoint,
  options: OpenAPITypesOptions,
): Promise<string> {
  try {
    const document = await loadOpenAPIDocument(endpoint.schema, { rootDir: options.rootDir })
    return generateSchemaTypes(document)
  }
  catch (error) {
    logger.error(`Failed to generate types for ${id}`, error)
    return EMPTY_SCHEMA_TYPES
  }
}
