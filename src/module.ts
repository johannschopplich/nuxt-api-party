import type { HookResult } from '@nuxt/schema'
import type { OpenAPI3, OpenAPITSOptions } from 'openapi-typescript'
import type { QueryObject } from 'ufo'
import { addImportsSources, addServerHandler, addTemplate, createResolver, defineNuxtModule, useLogger } from '@nuxt/kit'
import { defu } from 'defu'
import { createJiti } from 'jiti'
import { relative } from 'pathe'
import { camelCase, pascalCase } from 'scule'
import { joinURL } from 'ufo'
import { name } from '../package.json'
import { generateDeclarationTypes } from './openapi'

export interface EndpointConfiguration {
  url: string
  token?: string
  query?: QueryObject
  headers?: Record<string, string>
  cookies?: boolean
  allowedUrls?: string[]
  schema?: string | OpenAPI3
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
   * - `allowedUrls`: A list of allowed URLs to change the [backend URL at runtime](https://nuxt-api-party.byjohann.dev/guide/dynamic-backend-url) (optional)
   * - `schema`: A URL, file path, object, or async function pointing to an [OpenAPI Schema](https://swagger.io/resources/open-api) used to [generate types](/guide/openapi-types) (optional)
   * - `openAPITS`: [Configuration options](https://openapi-ts.pages.dev/node/#options) for `openapi-typescript`. Options defined here will override the global `openAPITS`
   *
   * @example
   * export default defineNuxtConfig({
   *   apiParty: {
   *     endpoints: {
   *       jsonPlaceholder: {
   *         url: 'https://jsonplaceholder.typicode.com'
   *         headers: {
   *           Authorization: `Basic ${globalThis.btoa('username:password')}`
   *         }
   *       }
   *     }
   *   }
   * })
   *
   * @default {}
   */
  endpoints?: Record<string, EndpointConfiguration>

  /**
   * Allow client-side requests besides server-side ones
   *
   * @remarks
   * By default, API requests are only made on the server-side. This option allows you to make requests on the client-side as well. Keep in mind that this will expose your API credentials to the client.
   * Note: If Nuxt SSR is disabled, all requests are made on the client-side by default.
   *
   * @example
   * useJsonPlaceholderData('/posts/1', { client: true })
   *
   * @default false
   */
  client?: boolean | 'allow' | 'always'

  /**
   * Global options for openapi-typescript
   */
  openAPITS?: OpenAPITSOptions

  server?: {
    /**
     * The API base route for the Nuxt server handler
     *
     * @default '__api_party'
     */
    basePath?: string
  }
}

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    apiParty: ModuleOptions
  }

  interface NuxtHooks {
    'api-party:extend': (options: ModuleOptions) => HookResult
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    configKey: 'apiParty',
    compatibility: {
      nuxt: '>=3.7',
    },
  },
  defaults: {
    endpoints: {},
    client: false,
    openAPITS: {},
    server: {
      basePath: '__api_party',
    },
  },
  async setup(options, nuxt) {
    const moduleName = name
    const logger = useLogger(moduleName)
    const getRawComposableName = (endpointId: string) => `$${camelCase(endpointId)}`
    const getDataComposableName = (endpointId: string) => `use${pascalCase(endpointId)}Data`

    if (
      !Object.keys(options.endpoints!).length
      && !nuxt.options.runtimeConfig.apiParty
    )
      logger.error('Missing API endpoints configuration. Please check the `apiParty` module configuration in `nuxt.config.ts`.')

    // Private runtime config
    nuxt.options.runtimeConfig.apiParty = defu(
      nuxt.options.runtimeConfig.apiParty,
      options,
    )

    if (!nuxt.options.ssr) {
      logger.info('Enabling Nuxt API Party client requests by default because SSR is disabled.')
      options.client = 'always'
    }

    const resolvedOptions = nuxt.options.runtimeConfig.apiParty as Required<ModuleOptions>

    nuxt.callHook('api-party:extend', resolvedOptions)

    // Write options to public runtime config if client requests are enabled
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: `client` types are not compatible
    nuxt.options.runtimeConfig.public.apiParty = defu(
      nuxt.options.runtimeConfig.public.apiParty as Required<ModuleOptions>,
      resolvedOptions.client
        ? resolvedOptions
        : {
            // Only expose cookies endpoint option to the client
            endpoints: Object.fromEntries(
              Object.entries(resolvedOptions.endpoints).map(
                ([endpointId, endpoint]) => [endpointId, { cookies: endpoint.cookies }],
              ),
            ),
            client: false,
            server: resolvedOptions.server,
          },
    )

    // Transpile runtime
    const { resolve } = createResolver(import.meta.url)
    nuxt.options.build.transpile.push(resolve('runtime'))

    const relativeTo = (path: string) => relative(
      resolve(nuxt.options.rootDir, nuxt.options.buildDir, 'module'),
      resolve(path),
    )

    const endpointKeys = Object.keys(resolvedOptions.endpoints)
    const schemaEndpoints = Object.fromEntries(
      Object.entries(resolvedOptions.endpoints)
        .filter(([, endpoint]) => 'schema' in endpoint),
    )
    const schemaEndpointIds = Object.keys(schemaEndpoints)
    const jiti = createJiti(nuxt.options.rootDir, { alias: nuxt.options.alias })
    const openAPITSSrc = jiti.esmResolve('openapi-typescript', { default: true, try: true })

    if (schemaEndpointIds.length && !openAPITSSrc) {
      logger.warn('OpenAPI types generation is enabled, but the `openapi-typescript` package is not found. Please install it to enable endpoint types generation.')
      schemaEndpointIds.length = 0
    }

    // Add Nuxt server route to proxy the API request server-side
    addServerHandler({
      route: joinURL('/api', options.server!.basePath!, ':endpointId'),
      handler: resolve('runtime/server/handler'),
      method: 'post',
    })

    nuxt.hook('nitro:config', (config) => {
      // Inline local server handler dependencies into Nitro bundle
      // Needed to circumvent "cannot find module" error in `server.ts` for the `utils` import
      config.externals ||= {}
      config.externals.inline ||= []
      config.externals.inline.push(...[
        resolve('runtime/utils'),
        resolve('runtime/form-data'),
        resolve('runtime/server/$api'),
      ])

      // Provide `#nuxt-api-party/server` module alias for Nitro
      config.alias ||= {}
      config.alias[`#${moduleName}/server`] = resolve(nuxt.options.buildDir, `module/${moduleName}-nitro`)

      config.virtual ||= {}
      config.virtual[`#${moduleName}/server`] = () => `
import { _$api } from '${resolve('runtime/server/$api')}'
${endpointKeys.map(i => `
export const ${getRawComposableName(i)} = (...args) => _$api('${i}', ...args)
`.trimStart()).join('')}`.trimStart()

      if (schemaEndpointIds.length) {
        config.typescript ||= {}
        config.typescript.tsConfig ||= {}
        config.typescript.tsConfig.include ||= []
        config.typescript.tsConfig.include.push(`./module/${moduleName}-schema.d.ts`)
      }

      // Add Nitro auto-imports for generated composables
      config.imports = defu(config.imports, {
        presets: [{
          from: `#${moduleName}/server`,
          imports: endpointKeys.map(getRawComposableName),
        }],
      })
    })

    // Add Nuxt auto-imports for generated composables
    addImportsSources({
      from: resolve(nuxt.options.buildDir, `module/${moduleName}`),
      imports: endpointKeys.flatMap(i => [getRawComposableName(i), getDataComposableName(i)]),
    })

    // Add `#nuxt-api-party` module alias for generated composables
    nuxt.options.alias[`#${moduleName}`] = resolve(nuxt.options.buildDir, `module/${moduleName}`)

    // Add module template for generated composables
    addTemplate({
      filename: `module/${moduleName}.mjs`,
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

    // Add types for Nuxt auto-imports and the `#nuxt-api-party` module alias
    addTemplate({
      filename: `module/${moduleName}.d.ts`,
      getContents() {
        return `
// Generated by ${moduleName}
import type { ApiClient, OpenAPIClient, ApiClientFetchOptions, OpenAPIClientFetchOptions } from '${relativeTo('runtime/composables/$api')}'
import type { UseApiData, UseOpenAPIData, UseApiDataOptions, UseOpenAPIDataOptions } from '${relativeTo('runtime/composables/useApiData')}'

${schemaEndpointIds.map(i => `
import type { paths as ${pascalCase(i)}Paths, operations as ${pascalCase(i)}Operations } from '#${moduleName}/${i}'
`.trimStart()).join('').trimEnd()}

// OpenAPI helpers
export type { FetchResponseData, FetchResponseError, MethodOption, ParamsOption, RequestBodyOption, FilterMethods } from '${relativeTo('runtime/openapi')}'
// Clients
export type { ApiClient, OpenAPIClient, ApiClientFetchOptions, OpenAPIClientFetchOptions, UseApiData, UseOpenAPIData, UseApiDataOptions, UseOpenAPIDataOptions }

${endpointKeys.map(i => `
export declare const ${getRawComposableName(i)}: ${schemaEndpointIds.includes(i) ? `OpenAPIClient<${pascalCase(i)}Paths>` : 'ApiClient'}
export declare const ${getDataComposableName(i)}: ${schemaEndpointIds.includes(i) ? `UseOpenAPIData<${pascalCase(i)}Paths>` : 'UseApiData'}
`.trimStart()).join('').trimEnd()}
`.trimStart()
      },
    })

    // Add types for Nitro auto-imports and the `#nuxt-api-party/server` module alias
    addTemplate({
      filename: `module/${moduleName}-nitro.d.ts`,
      getContents() {
        return `
// Generated by ${moduleName}
export { ${endpointKeys.map(getRawComposableName).join(', ')} } from './${moduleName}'
`.trimStart()
      },
    })

    // Add type references for endpoints with OpenAPI schemas
    if (schemaEndpointIds.length) {
      addTemplate({
        filename: `module/${moduleName}-schema.d.ts`,
        async getContents() {
          return `
// Generated by ${moduleName}
${await generateDeclarationTypes(schemaEndpoints, resolvedOptions.openAPITS)}
`.trimStart()
        },
      })

      nuxt.hook('prepare:types', ({ references }) => {
        references.push({ path: resolve(nuxt.options.buildDir, `module/${moduleName}-schema.d.ts`) })
      })
    }
  },
})
