import type { HookResult, Nuxt } from '@nuxt/schema'
import type { OpenAPI3, OpenAPITSOptions } from 'openapi-typescript'
import type { QueryObject } from 'ufo'
import { fileURLToPath } from 'node:url'
import { addImportsSources, addServerHandler, addTemplate, addTypeTemplate, createResolver, defineNuxtModule, updateTemplates, useLogger } from '@nuxt/kit'
import { watch } from 'chokidar'
import { defu } from 'defu'
import { createJiti } from 'jiti'
import { relative } from 'pathe'
import { camelCase, pascalCase } from 'scule'
import { joinURL } from 'ufo'
import { name } from '../package.json'
import { generateOpenAPITypeHelpers, generateOpenAPITypes } from './openapi'

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
   * - `url` (required): Base URL of the API
   * - `token` (optional): Bearer token for authentication
   * - `query` (optional): Default query parameters to send with each request
   * - `headers` (optional): Default headers to send with each request
   * - `cookies` (optional): Whether to forward cookies in requests
   * - `allowedUrls` (optional): URLs allowed for [dynamic backend switching](https://nuxt-api-party.byjohann.dev/guides/dynamic-backend-url)
   * - `schema` (optional): [OpenAPI Schema](https://swagger.io/resources/open-api) schema URL or file path for [type generation](https://nuxt-api-party.byjohann.dev/guides/openapi-integration)
   * - `openAPITS` (optional): Endpoint-specific configuration options for [`openapi-typescript`](https://openapi-ts.dev/node/#options). Will override the global `openAPITS` options if provided.
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
   * By default, API requests are only initiated server-side. This option allows you to make requests on the client-side as well. Keep in mind that this will expose your API credentials to the client.
   * Note: If Nuxt SSR is disabled, all requests are made on the client-side by default.
   *
   * @example
   * useJsonPlaceholderData('/posts/1', { client: true })
   *
   * @default false
   */
  client: boolean | 'allow' | 'always'

  /**
   * Global options for [`openapi-typescript`](https://openapi-ts.dev/node/#options)
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

    /**
     * Enable the file watcher for local OpenAPI schema files using chokidar.
     *
     * When enabled, changes to local schema files will automatically regenerate the types. When disabled, you will
     * need to restart the Nuxt dev server to pick up changes to local schema files. Has no effect if no local schema
     * files are used or for remote schemas.
     *
     * @default true
     */
    enableSchemaFileWatcher?: boolean
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

export default defineNuxtModule<ModuleOptions>().with({
  meta: {
    name,
    configKey: 'apiParty',
    compatibility: {
      nuxt: '>=3.18',
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
      enableSchemaFileWatcher: true,
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
      logger.warn('No API endpoints found. Nuxt API Party requires at least one defined endpoint.')
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
      logger.warn('OpenAPI types generation is enabled, but the `openapi-typescript` package is missing. Please install it to enable endpoint types generation.')
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
      config.externals.inline.push(
        resolve('runtime/utils'),
        resolve('runtime/form-data'),
        resolve('runtime/server/$api'),
      )

      // Provide `#nuxt-api-party/server` module alias for Nitro
      config.alias ||= {}
      config.alias[`#${moduleName}/server`] = resolve(nuxt.options.buildDir, `module/${moduleName}.nitro`)

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
        config.typescript.tsConfig.include.push(
          `./module/${moduleName}.schema.d.ts`,
          `./module/${moduleName}.hooks.d.ts`,
        )
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
import type { paths as ${pascalCase(i)}Paths, components as ${pascalCase(i)}Components, operations as ${pascalCase(i)}Operations } from '#${moduleName}/${i}'
`.trimStart()).join('').trimEnd()}

export type { FetchResponseData, FetchResponseError, MethodOption, ParamsOption, RequestBodyOption, FilterMethods } from '${relativeTo('runtime/openapi')}'
export type { ApiClient, OpenAPIClient, ApiClientFetchOptions, OpenAPIClientFetchOptions, UseApiData, UseOpenAPIData, UseApiDataOptions, UseOpenAPIDataOptions }

${endpointKeys.map(i => `
export declare const ${getRawComposableName(i)}: ${schemaEndpointIds.includes(i) ? `OpenAPIClient<${pascalCase(i)}Paths>` : 'ApiClient'}
export declare const ${getDataComposableName(i)}: ${schemaEndpointIds.includes(i) ? `UseOpenAPIData<${pascalCase(i)}Paths>` : 'UseApiData'}
`.trimStart()).join('').trimEnd()}

${schemaEndpointIds.map(generateOpenAPITypeHelpers).join('\n\n')}

// Type helpers for OpenAPI schemas
type NonNeverKeys<T> = { [K in keyof T]: T[K] extends never ? never : K }[keyof T]
type PathMethods<T, P extends keyof T> = Exclude<NonNeverKeys<T[P]>, 'parameters'>
`.trimStart()
      },
    })

    // Add types for Nitro auto-imports and the `#nuxt-api-party/server` module alias
    addTemplate({
      filename: `module/${moduleName}.nitro.d.ts`,
      getContents() {
        return `
// Generated by ${moduleName}
export { ${endpointKeys.map(getRawComposableName).join(', ')} } from './${moduleName}'
`.trimStart()
      },
    })

    // Add types for Nuxt and Nitro runtime hooks
    addTypeTemplate({
      filename: `module/${moduleName}.hooks.d.ts`,
      getContents() {
        return `
// Generated by ${moduleName}
import type { HookResult } from '@nuxt/schema'
import type { H3Event } from 'h3'
import type { FetchContext, FetchResponse } from 'ofetch'

declare module '#app' {
  interface RuntimeNuxtHooks {
    'api-party:request': (options: FetchContext) => HookResult
    'api-party:response': (options: Omit<FetchContext, 'response'> & { response: FetchResponse<any> }) => HookResult
    ${endpointKeys.flatMap(i => [
      `'api-party:request:${i}': (option: FetchContext) => HookResult`,
      `'api-party:response:${i}': (option: Omit<FetchContext, 'response'> & { response: FetchResponse<any> }) => HookResult`,
    ]).join('\n    ')}
  }
}

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    'api-party:request': (options: FetchContext, event: H3Event) => HookResult
    'api-party:response': (options: Omit<FetchContext, 'response'> & { response: FetchResponse<any> }, event: H3Event) => HookResult
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
        filename: `module/${moduleName}.schema.d.ts`,
        async getContents() {
          return `
// Generated by ${moduleName}
${await generateOpenAPITypes(schemaEndpoints, options.openAPITS)}
`.trimStart()
        },
      })

      nuxt.hooks.hook('prepare:types', ({ references }) => {
        references.push({ path: resolve(nuxt.options.buildDir, `module/${moduleName}.schema.d.ts`) })
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

    if (nuxt.options.dev && options.experimental.enableSchemaFileWatcher) {
      // Watch for changes in local schema files
      const schemaFiles = Object.values(schemaEndpoints)
        .map(({ schema }) => schema)
        .filter((schema): schema is string => typeof schema === 'string' && !/^https?:\/\//.test(schema))
        .map(schema => schema.startsWith('file:') ? fileURLToPath(schema) : schema)
        .map(schema => resolve(nuxt.options.rootDir, schema))

      createSchemaWatcher(schemaFiles, nuxt)
    }
  },
})

function createSchemaWatcher(schemaFiles: string[], nuxt: Nuxt) {
  if (!schemaFiles.length) {
    // No local schema files to watch
    return
  }

  const watcher = watch(schemaFiles)
  const watcherCallback = () => {
    // Update the schema types template, which will trigger a types regeneration
    // Ignore the file path since only the watched files will trigger this
    updateTemplates({ filter: t => t.filename === `module/${name}.schema.d.ts` })
  }

  watcher.on('change', watcherCallback)
  watcher.on('add', watcherCallback)
  watcher.on('unlink', watcherCallback)

  // Close watcher on Nuxt `close`, otherwise reloads may leave orphaned watchers and duplicate events
  nuxt.hooks.hook('close', () => watcher.close())
}
