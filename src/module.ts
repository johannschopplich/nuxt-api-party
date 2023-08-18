import { relative } from 'pathe'
import { defu } from 'defu'
import { camelCase, pascalCase } from 'scule'
import { addImportsSources, addServerHandler, addTemplate, createResolver, defineNuxtModule, tryResolveModule, useLogger } from '@nuxt/kit'
import type { OpenAPI3, OpenAPITSOptions } from 'openapi-typescript'
import type { QueryObject } from 'ufo'
import { generateTypes } from './openapi'

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
  async setup(options, nuxt) {
    const moduleName = 'nuxt-api-party'
    const logger = useLogger(moduleName)
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

    // Add Nuxt server route to proxy the API request server-side
    addServerHandler({
      route: '/api/__api_party/:endpointId',
      method: 'post',
      handler: resolve('runtime/server'),
    })

    nuxt.hook('nitro:config', (config) => {
      // Inline server handler into Nitro bundle
      // Needed to circumvent "cannot find module" error in `server.ts` for the `utils` import
      config.externals ||= {}
      config.externals.inline ||= []
      config.externals.inline.push(...[
        resolve('runtime/utils'),
        resolve('runtime/formData'),
      ])
    })

    const endpointKeys = Object.keys(resolvedOptions.endpoints)

    // Nuxt will resolve the imports relative to the `srcDir`, so we can't use
    // `#nuxt-api-party` with `declare module` pattern here
    addImportsSources({
      from: resolve(nuxt.options.buildDir, `module/${moduleName}-imports.mjs`),
      imports: endpointKeys.flatMap(i => [getRawComposableName(i), getDataComposableName(i)]),
    })

    // Add `#nuxt-api-party` module alias for generated composables
    nuxt.options.alias[`#${moduleName}`] = resolve(nuxt.options.buildDir, `module/${moduleName}-imports.mjs`)

    const relativeTo = (path: string) => relative(
      resolve(nuxt.options.rootDir, nuxt.options.buildDir, 'module'),
      resolve(path),
    )

    // Add module template for generated composables
    addTemplate({
      filename: `module/${moduleName}-imports.mjs`,
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

    const schemaEndpoints = Object.fromEntries(
      Object.entries(resolvedOptions.endpoints)
        .filter(([, endpoint]) => 'schema' in endpoint),
    )
    const schemaEndpointIds = Object.keys(schemaEndpoints)
    const hasOpenAPIPkg = await tryResolveModule('openapi-typescript', [nuxt.options.rootDir])

    if (schemaEndpointIds.length && !hasOpenAPIPkg) {
      logger.warn('OpenAPI types generation is enabled, but the `openapi-typescript` package is not found. Please install it to enable endpoint types generation.')
      schemaEndpointIds.length = 0
    }

    // Use generated types for generated composables for
    // (1) Nuxt auto-imports
    // (2) global import from `#nuxt-api-party`
    addTemplate({
      filename: `module/${moduleName}-imports.d.ts`,
      getContents() {
        return `
// Generated by ${moduleName}
import type { $Api } from '${relativeTo('runtime/composables/$api')}'
import type { UseApiData } from '${relativeTo('runtime/composables/useApiData')}'

${schemaEndpointIds.map(i => `import type { paths as ${pascalCase(i)}Paths } from '#${moduleName}/${i}'`).join('')}

${endpointKeys.map(i => `
export declare const ${getRawComposableName(i)}: $Api${schemaEndpointIds.includes(i) ? `<${pascalCase(i)}Paths>` : ''}
export declare const ${getDataComposableName(i)}: UseApiData${schemaEndpointIds.includes(i) ? `<${pascalCase(i)}Paths>` : ''}
`.trimStart()).join('').trimEnd()}
`.trimStart()
      },
    })

    // Add global `#nuxt-api-party` and OpenAPI endpoint types
    addTemplate({
      filename: `module/${moduleName}.d.ts`,
      async getContents() {
        return `
// Generated by ${moduleName}
declare module '#${moduleName}' {
  export * from './${moduleName}-imports'
}

${schemaEndpointIds.length
  ? await generateTypes(schemaEndpoints, resolvedOptions.openAPITS)
  : ''}
`.trimStart()
      },
    })

    // Add type references to TypeScript config
    nuxt.hook('prepare:types', (options) => {
      options.references.push({ path: resolve(nuxt.options.buildDir, `module/${moduleName}.d.ts`) })
      options.references.push({ path: resolve(nuxt.options.buildDir, `module/${moduleName}-imports.d.ts`) })
    })
  },
})
