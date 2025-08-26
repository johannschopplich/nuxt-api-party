import type { HookResult } from '@nuxt/schema'
import type { H3Event } from 'h3'
import type { FetchContext, FetchResponse } from 'ofetch'
import type { OpenAPI3, OpenAPITSOptions } from 'openapi-typescript'
import type { QueryObject } from 'ufo'
import { addImportsSources, addServerHandler, addTemplate, addTypeTemplate, createResolver, defineNuxtModule, useLogger } from '@nuxt/kit'
import { defu } from 'defu'
import { createJiti } from 'jiti'
import { relative } from 'pathe'
import { camelCase, pascalCase } from 'scule'
import { joinURL } from 'ufo'
import { name } from '../package.json'
import { generateDeclarationTypes } from './openapi'

// #region options
// #region endpoints
export interface EndpointConfiguration {
  url: string
  token?: string
  query?: QueryObject
  headers?: HeadersInit
  cookies?: boolean
  allowedUrls?: string[]
  schema?: string | OpenAPI3
  openAPITS?: OpenAPITSOptions
}
// #endregion endpoints

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
  endpoints: Record<string, EndpointConfiguration>

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
  client: boolean | 'allow' | 'always'

  /**
   * Global options for openapi-typescript
   */
  openAPITS: OpenAPITSOptions

  server: {
    /**
     * The API base route for the Nuxt server handler
     *
     * @default '__api_party'
     */
    basePath?: string
  }

  experimental: {
    /**
     * Enable key injection for `useMyApiData` composables like Nuxt's `useAsyncData` and `useFetch` composables.
     *
     * With an auto-generated default key, payload caching will be unique for each instance without an explicit key option.
     *
     * @default false
     */
    enableAutoKeyInjection?: boolean
    /**
     * Set to `true` to enable prefixed proxy endpoints.
     *
     * Prefixed endpoints more closely match the target endpoint's request by forwarding the path, method, headers,
     * query, and body directly to the backend. It uses h3's `proxyRequest` utility. The default behavior is to wrap
     * each endpoint in a POST request.
     *
     * @default false
     */
    enablePrefixedProxy?: boolean

    /**
     * Set to `true` to disable the built-in payload caching mechanism by default.
     *
     * Disabling this can be useful if you want to implement your own caching strategy or reuse the browser's HTTP
     * cache by setting the `cache` option on requests.
     *
     * @default false
     */
    disableClientPayloadCache?: boolean
  }
}
// #endregion options

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    apiParty: {
      endpoints: Record<string, EndpointConfiguration>
    }
  }

  interface PublicRuntimeConfig {
    apiParty: {
      endpoints: Record<string, Partial<EndpointConfiguration>>
    }
  }

  interface NuxtHooks {
    'api-party:extend': (options: ModuleOptions) => HookResult
  }
}

declare module '#app' {
  interface RuntimeNuxtHooks {
    'api-party:request': (options: FetchContext) => HookResult
    'api-party:response': (options: Omit<FetchContext, 'response'> & { response: FetchResponse<any> }) => HookResult
  }
}

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    'api-party:request': (options: FetchContext, event: H3Event) => HookResult
    'api-party:response': (options: Omit<FetchContext, 'response'> & { response: FetchResponse<any> }, event: H3Event) => HookResult
  }
}

export default defineNuxtModule<ModuleOptions>().with({
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
    experimental: {
      enableAutoKeyInjection: false,
      enablePrefixedProxy: false,
      disableClientPayloadCache: false,
    },
  },
  async setup(options, nuxt) {
    const moduleName = name
    const logger = useLogger(moduleName)
    const getRawComposableName = (endpointId: string) => `$${camelCase(endpointId)}`
    const getDataComposableName = (endpointId: string) => `use${pascalCase(endpointId)}Data`

    if (!nuxt.options.ssr) {
      logger.info('Enabling Nuxt API Party client requests by default because SSR is disabled.')
      options.client = 'always'
    }

    await nuxt.callHook('api-party:extend', options)

    // Private runtime config
    nuxt.options.runtimeConfig.apiParty = defu(
      nuxt.options.runtimeConfig.apiParty,
      { endpoints: options.endpoints },
    )

    const resolvedOptions = nuxt.options.runtimeConfig.apiParty

    if (!Object.keys(resolvedOptions.endpoints).length) {
      logger.warn('No API endpoints found. Please add at least one endpoint to your configuration.')
    }

    // Write options to public runtime config if client requests are enabled
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-ignore: `client` types are not compatible
    nuxt.options.runtimeConfig.public.apiParty = defu(
      nuxt.options.runtimeConfig.public.apiParty,
      options.client
        ? resolvedOptions
        : {
            // Only expose cookies endpoint option to the client
            endpoints: Object.fromEntries(
              Object.entries(resolvedOptions.endpoints).map(
                ([endpointId, endpoint]) => [endpointId, { cookies: endpoint.cookies }],
              ),
            ),
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

    if (options.experimental.enablePrefixedProxy) {
      // Add Nuxt server route to proxy the API request server-side
      addServerHandler({
        route: joinURL('/api', options.server.basePath, ':endpointId/proxy/**:path'),
        handler: resolve('runtime/server/proxyHandler'),
      })
      // Duplicated server handler because empty path will respond with 404
      addServerHandler({
        route: joinURL('/api', options.server.basePath, ':endpointId/proxy/'),
        handler: resolve('runtime/server/proxyHandler'),
      })
    }
    else {
      addServerHandler({
        route: joinURL('/api', options.server.basePath, ':endpointId'),
        handler: resolve('runtime/server/handler'),
        method: 'post',
      })
    }

    nuxt.hooks.hook('nitro:config', (config) => {
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

      if (endpointKeys.length) {
        config.typescript ||= {}
        config.typescript.tsConfig ||= {}
        config.typescript.tsConfig.include ||= []
        config.typescript.tsConfig.include.push(`./module/${moduleName}-schema.d.ts`)
        config.typescript.tsConfig.include.push(`./module/${moduleName}-hooks.d.ts`)
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
    const modTemplate = addTemplate({
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

    if (options.experimental.enableAutoKeyInjection) {
      // Register composables for Nuxt autokey
      nuxt.options.optimization.keyedComposables.push(
        ...endpointKeys.map(i => ({
          name: getDataComposableName(i),
          argumentLength: 3,
          source: modTemplate.dst,
        })),
      )
    }

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

    // Add types for Nuxt and Nitro runtime hooks
    addTypeTemplate({
      filename: `module/${moduleName}-hooks.d.ts`,
      getContents() {
        return `
// Generated by ${moduleName}
import type { HookResult } from '@nuxt/schema'
import type { FetchContext, FetchResponse } from 'ofetch'
import type { H3Event } from 'h3'

declare module '#app' {
  interface RuntimeNuxtHooks {
    ${endpointKeys.flatMap(i => [
      `'api-party:request:${i}': (option: FetchContext) => HookResult`,
      `'api-party:response:${i}': (option: Omit<FetchContext, 'response'> & { response: FetchResponse<any> }) => HookResult`,
    ]).join('\n    ')}
  }
}

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    ${endpointKeys.flatMap(i => [
      `'api-party:request:${i}': (option: FetchContext, event: H3Event) => HookResult`,
      `'api-party:response:${i}': (option: Omit<FetchContext, 'response'> & { response: FetchResponse<any> }, event: H3Event) => HookResult`,
    ]).join('\n    ')}
  }
}
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
${await generateDeclarationTypes(schemaEndpoints, options.openAPITS)}
`.trimStart()
        },
      })

      nuxt.hooks.hook('prepare:types', ({ references }) => {
        references.push({ path: resolve(nuxt.options.buildDir, `module/${moduleName}-schema.d.ts`) })
      })
    }

    // Provide module options as constants
    addTemplate({
      filename: `module/${moduleName}.config.mjs`,
      getContents: () => `
export const allowClient = ${JSON.stringify(options.client)}
export const serverBasePath = ${JSON.stringify(options.server.basePath)}

export const experimentalEnablePrefixedProxy = ${JSON.stringify(options.experimental.enablePrefixedProxy)}
export const experimentalDisableClientPayloadCache = ${JSON.stringify(options.experimental.disableClientPayloadCache)}
`.trimStart(),
    })

    addTemplate({
      filename: `module/${moduleName}.config.d.ts`,
      write: false, // Internal config, no need to write to disk
      getContents: () => `
export declare const allowClient: boolean | 'allow' | 'always'
export declare const serverBasePath: string

export declare const experimentalEnablePrefixedProxy: boolean
export declare const experimentalDisableClientPayloadCache: boolean
`.trimStart(),
    })
  },
})
