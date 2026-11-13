import type { EndpointConfiguration } from './module'
import { declareModule, EMPTY_DOCUMENT_TYPES, generateDocumentTypes, loadOpenAPIDocument } from 'apiful/openapi/generate'
import { logger } from './kit'

type SchemaEndpoint = EndpointConfiguration & {
  schema: NonNullable<EndpointConfiguration['schema']>
}

export interface OpenAPITypesOptions {
  /** Directory a relative schema path resolves against. */
  rootDir: string
}

export interface OpenAPITypes {
  /**
   * One module declaration per schema endpoint. A schema that failed to load declares `paths` and `components`
   * without members, so the type helpers named after it still compile.
   */
  declarations: string
  /** Schema endpoints whose schema loaded, the only ones typed as an OpenAPI client. */
  typedEndpointIds: string[]
}

export async function generateOpenAPITypes(
  endpoints: Record<string, EndpointConfiguration>,
  options: OpenAPITypesOptions,
): Promise<OpenAPITypes> {
  const results = await Promise.all(
    Object.entries(endpoints)
      .filter((entry): entry is [string, SchemaEndpoint] => hasSchema(entry[1]))
      .map(async ([id, endpoint]) => ({ id, types: await generateEndpointTypes(id, endpoint, options) })),
  )

  return {
    declarations: results
      .map(({ id, types }) => declareModule(`#nuxt-api-party/${id}`, types ?? EMPTY_DOCUMENT_TYPES))
      .join('\n'),
    typedEndpointIds: results
      .filter(({ types }) => types != null)
      .map(({ id }) => id),
  }
}

export function hasSchema(endpoint: EndpointConfiguration): endpoint is SchemaEndpoint {
  return Boolean(endpoint.schema)
}

async function generateEndpointTypes(
  id: string,
  endpoint: SchemaEndpoint,
  options: OpenAPITypesOptions,
): Promise<string | undefined> {
  try {
    const document = await loadOpenAPIDocument(endpoint.schema, { rootDir: options.rootDir })
    return generateDocumentTypes(document)
  }
  catch (error) {
    logger.error(`Failed to generate types for ${id}`, error)
  }
}
