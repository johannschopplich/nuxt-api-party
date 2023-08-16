import nodePath from 'node:path'
import { defu } from 'defu'
import { camelCase, pascalCase } from 'scule'
import { addImportsSources, addServerHandler, addTemplate, addTypeTemplate, createResolver, defineNuxtModule, useLogger } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import type { OpenAPI3, OpenAPITSOptions } from 'openapi-typescript'
import type { QueryObject } from 'ufo'

export interface Endpoint {
  url: string
  token?: string
  query?: QueryObject
  headers?: Record<string, string>
  cookies?: boolean
  allowedUrls?: string[]
  schema?: string | URL | OpenAPI3 | (() => Promise<OpenAPI3>)
  openAPITS?: OpenAPITSOptions
}

export interface ModuleOptions {
  /**
   * API endpoints
   *
   * @remarks
   * Each key represents an endpoint ID, which is used to generate the composables. The value is an object with the following properties:
   * - `url`: The URL of the API endpoint
   * - `token`: The API token to use for the endpoint (optional)
   * - `query`: Query parameters to send with each request (optional)
   * - `headers`: Headers to send with each request (optional)
   * - `cookies`: Whether to send cookies with each request (optional)
   * - `allowedUrls`: A list of allowed URLs to change the backend URL at runtime (optional)
   *
   * @example
   * export default defineNuxtConfig({
   *   apiParty: {
   *     endpoints: {
   *       jsonPlaceholder: {
   *         url: 'https://jsonplaceholder.typicode.com'
   *         headers: {
   *           Authorization: `Basic ${Buffer.from('foo:bar').toString('base64')}`
   *         }
   *       }
   *     }
   *   }
   * })
   *
   * @default {}
   */
  endpoints?: Record<string, Endpoint>

  /**
   * Allow client-side requests besides server-side ones
   *
   * @remarks
   * By default, API requests are only made on the server-side. This option allows you to make requests on the client-side as well. Keep in mind that this will expose your API credentials to the client.
   *
   * @example
   * useJsonPlaceholderData('/posts/1', { client: true })
   *
   * @default false
   */
  allowClient?: boolean

  /**
   * Global options for openapi-typescript
   */
  openAPITS?: OpenAPITSOptions
}

function isOpenapiTSInstalled(): boolean {
  try {
    require.resolve('openapi-typescript')
    return true
  }
  catch {
    return false
  }
}

async function resolveSchema(nuxt: Nuxt, { schema }: Endpoint): Promise<string | URL | OpenAPI3> {
  if (typeof schema === 'function')
    return await schema()

  // detect file path and fix it.
  if (typeof schema === 'string' && !schema.match(/^https?:\/\//))
    schema = nodePath.resolve(nuxt.options.rootDir, schema)

  return schema!
}

type OpenapiTS = typeof import('openapi-typescript')['default']

function generateTypes(nuxt: Nuxt, endpoints: Record<string, Endpoint>, ids: string[], globalOpenApiOptions: OpenAPITSOptions): () => Promise<string> {
  // openapi-typescript uses process.exit() to handle errors
  let runningCount = 0
  process.on('exit', () => {
    if (runningCount > 0)
      throw new Error('caught process.exit()')
  })
  return async () => {
    const openapiTS: OpenapiTS = await import('openapi-typescript') as any
    const schemas = await Promise.all(ids.map(async (id) => {
      let types = ''
      if (id in endpoints && 'schema' in endpoints[id]) {
        const { openAPITS = {} } = endpoints[id]
        const schema = await resolveSchema(nuxt, endpoints[id])

        runningCount++
        try {
          types = await openapiTS(schema, { commentHeader: '', ...globalOpenApiOptions, ...openAPITS })
        }
        catch {
          types = `
export type paths = Record<string, any>
export type webhooks = Record<string, any>
export type components = Record<string, any>
export type external = Record<string, any>
export type operations = Record<string, any>
          `.trimStart()
        }
        finally {
          runningCount--
        }
      }
      return `
declare module '#nuxt-api-party/${id}' {
${types.replace(/^/gm, '  ').trimEnd()}
}`.trimStart()
    }))

    return schemas.join('\n\n')
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-api-party',
    configKey: 'apiParty',
    compatibility: {
      nuxt: '^3',
    },
  },
  defaults: {
    endpoints: {},
    allowClient: false,
    openAPITS: {},
  },
  setup(options, nuxt) {
    const logger = useLogger('nuxt-api-party')
    const getRawComposableName = (endpointId: string) => `$${camelCase(endpointId)}`
    const getDataComposableName = (endpointId: string) => `use${pascalCase(endpointId)}Data`

    if (
      Object.keys(options.endpoints!).length === 0
      && !nuxt.options.runtimeConfig.apiParty
    )
      logger.error('Missing any API endpoint configuration. Please set `apiParty` module options in `nuxt.config.ts`.')

    // Private runtime config
    nuxt.options.runtimeConfig.apiParty = defu(
      nuxt.options.runtimeConfig.apiParty,
      options,
    )

    const resolvedOptions = nuxt.options.runtimeConfig.apiParty as Required<ModuleOptions>

    // Write options to public runtime config if client requests are enabled
    nuxt.options.runtimeConfig.public.apiParty = defu(
      nuxt.options.runtimeConfig.public.apiParty,
      resolvedOptions.allowClient
        ? resolvedOptions
        : {
            // Only expose cookies endpoint option to the client
            endpoints: Object.fromEntries(
              Object.entries(resolvedOptions.endpoints).map(
                ([endpointId, endpoint]) => [endpointId, { cookies: endpoint.cookies }],
              ),
            ),
            allowClient: false,
          },
    )

    // Transpile runtime
    const { resolve } = createResolver(import.meta.url)
    nuxt.options.build.transpile.push(resolve('runtime'))

    // Inline server handler into Nitro bundle
    // Needed to circumvent "cannot find module" error in `server.ts` for the `utils` import
    nuxt.hook('nitro:config', (config) => {
      config.externals = defu(config.externals, {
        inline: [
          resolve('runtime/utils'),
          resolve('runtime/formData'),
        ],
      })
    })

    // Add Nuxt server route to proxy the API request server-side
    addServerHandler({
      route: '/api/__api_party/:endpointId',
      method: 'post',
      handler: resolve('runtime/server'),
    })

    const endpointKeys = Object.keys(resolvedOptions.endpoints)

    addImportsSources({
      from: '#build/api-party',
      imports: endpointKeys.flatMap(i => [getRawComposableName(i), getDataComposableName(i)]),
    })

    // Add generated composables
    addTemplate({
      filename: 'api-party.mjs',
      getContents() {
        return `
import { _$api } from '${resolve('runtime/composables/$api')}'
import { _useApiData } from '${resolve('runtime/composables/useApiData')}'
${endpointKeys.map(i => `
export const ${getRawComposableName(i)} = (...args) => _$api('${i}', ...args)
export const ${getDataComposableName(i)} = (...args) => _useApiData('${i}', ...args)
`.trimStart()).join('')}`.trimStart()
      },
    })

    const schemaEndpoints: string[] = Object.entries(resolvedOptions.endpoints)
      .filter(([,endpoint]) => 'schema' in endpoint)
      .map(([id]) => id)

    if (schemaEndpoints.length) {
      if (isOpenapiTSInstalled()) {
        addTypeTemplate({
          filename: 'types/api-party-types.d.ts',
          getContents: generateTypes(nuxt, resolvedOptions.endpoints, schemaEndpoints, resolvedOptions.openAPITS),
        })
      }
      else {
        console.warn('openapi-typescript is not installed. Endpoint types will not be generated.')
        schemaEndpoints.length = 0
      }
    }
    // Add types for generated composables
    addTemplate({
      filename: 'api-party.d.ts',
      getContents() {
        return `
import type { $Api } from '${resolve('runtime/composables/$api')}'
import type { UseApiData } from '${resolve('runtime/composables/useApiData')}'
${schemaEndpoints.map(i => `
import type { paths as ${pascalCase(i)}Paths } from '#nuxt-api-party/${i}'
`).join('')}
${endpointKeys.map(i => `
export declare const ${getRawComposableName(i)}: $Api${schemaEndpoints.includes(i) ? `<${pascalCase(i)}Paths>` : ''}
export declare const ${getDataComposableName(i)}: UseApiData${schemaEndpoints.includes(i) ? `<${pascalCase(i)}Paths>` : ''}
`.trimStart()).join('')}`.trimStart()
      },
    })
  },
})
