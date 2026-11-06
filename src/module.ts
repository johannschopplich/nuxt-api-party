import type { HookResult, Nuxt } from '@nuxt/schema'
import type { OpenAPIDocumentSource } from 'apiful/openapi/generate'
import type { QueryObject } from 'ufo'
import type { ObjectPlugin, Plugin } from '#app'
import type { ApiClientFetchOptions, SharedFetchOptions } from './runtime/composables/$api'
import type { AllowedRoute } from './runtime/types'
import { fileURLToPath } from 'node:url'
import { addImportsSources, addServerHandler, addTemplate, addTypeTemplate, createResolver, defineNuxtModule, updateTemplates } from '@nuxt/kit'
import { generateTypeHelpers } from 'apiful/openapi/generate'
import { watch } from 'chokidar'
import { defu } from 'defu'
import { relative } from 'pathe'
import { camelCase, pascalCase } from 'scule'
import { joinURL } from 'ufo'
import { name } from '../package.json'
import { logger } from './kit'
import { generateOpenAPITypes, hasSchema } from './openapi'
import { assertValidOptions } from './options'

// #region options
// #region endpoints
export interface EndpointConfiguration {
  url: string
  token?: string
  query?: QueryObject
  headers?: Record<string, string>
  /**
   * Whether every request goes straight to the API, from the browser and during SSR, instead of through the server
   * proxy.
   *
   * @remarks
   * The endpoint's URL, token, query and headers are published to the browser.
   *
   * @default true if Nuxt SSR is disabled and the endpoint sets neither `forwardCredentials` nor `allowedRoutes`,
   * otherwise false
   */
  client?: boolean
  forwardCredentials?: boolean
  allowedRoutes?: AllowedRoute[]
  schema?: OpenAPIDocumentSource
}
// #endregion endpoints

export interface ModuleOptions {
  /**
   * API endpoints.
   *
   * @remarks
   * Each key represents an endpoint ID, which is used to generate the composables. The value is an object with the following properties:
   * - `url` (required): Base URL of the API
   * - `token` (optional): Bearer token for authentication
   * - `query` (optional): Default query parameters to send with each request
   * - `headers` (optional): Default headers to send with each request
   * - `client` (optional): Whether every request goes straight to the API instead of through the server proxy, which publishes the endpoint's URL and credentials to the browser
   * - `forwardCredentials` (optional): Whether the server proxy forwards the visitor's cookie and `Authorization` header to the API, and the API's `Set-Cookie` back
   * - `allowedRoutes` (optional): Routes the [server proxy may forward](https://nuxt-api-party.byjohann.dev/guides/allowed-routes)
   * - `schema` (optional): [OpenAPI](https://swagger.io/resources/open-api) document for [type generation](https://nuxt-api-party.byjohann.dev/guides/openapi-integration) – a file path, a `file:` or http(s) URL, the document itself, or an async function resolving to it
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
   * Cache a response in the Nuxt payload, keyed by the request.
   *
   * @remarks
   * Turn this off to run your own caching strategy or to rely on the browser's HTTP cache through the `cache` option.
   *
   * @default true
   */
  payloadCache?: boolean

}
// #endregion options

export interface APIPartyRuntimeConfig {
  endpoints: Record<string, Omit<EndpointConfiguration, 'schema'>>
}

export interface APIPartyPublicRuntimeConfig {
  /** Client endpoints only. */
  endpoints: Record<string, Pick<EndpointConfiguration, 'url' | 'token' | 'query' | 'headers'>>
}

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    apiParty: APIPartyRuntimeConfig
  }

  interface PublicRuntimeConfig {
    apiParty: APIPartyPublicRuntimeConfig
  }

  interface NuxtHooks {
    'api-party:extend': (options: ModuleOptions) => HookResult
  }
}

export type FetchOptionsDefaults = Omit<
  ApiClientFetchOptions & SharedFetchOptions,
  | 'key'
  | 'path'
  | 'method'
  | 'body'
>

export interface ModuleInjections {
  defaults?: FetchOptionsDefaults
  endpoints?: Record<string, {
    defaults?: FetchOptionsDefaults
  }>
}

export type ModulePlugin = Plugin<{ apiParty: ModuleInjections }>
  & ObjectPlugin<{ apiParty: ModuleInjections }>

declare module '#app' {
  interface NuxtApp {
    $apiParty?: ModuleInjections
  }
}

export default defineNuxtModule<ModuleOptions>().with({
  meta: {
    name,
    configKey: 'apiParty',
    compatibility: {
      nuxt: '>=4.0.0',
    },
  },
  defaults: {
    endpoints: {},
    payloadCache: true,
  },
  async setup(options, nuxt) {
    const moduleName = name
    const getRawComposableName = (endpointId: string) => `$${camelCase(endpointId)}`
    const getDataComposableName = (endpointId: string) => `use${pascalCase(endpointId)}Data`

    await nuxt.callHook('api-party:extend', options)

    // The runtime config takes endpoints of its own, so a removed option may hide there too.
    assertValidOptions(defu(nuxt.options.runtimeConfig.apiParty, options))

    // Annotated because `defu`'s return type widens the endpoint values to `unknown`.
    const mergedOptions: { endpoints: Record<string, EndpointConfiguration> } = defu(
      nuxt.options.runtimeConfig.apiParty,
      { endpoints: options.endpoints },
    )

    // A client-rendered app is often served statically, with no server proxy to send through, so its endpoints
    // default to client endpoints – except one that needs the server proxy for credential forwarding or allowed routes.
    const defaultClientEndpointIds = nuxt.options.ssr
      ? []
      : Object.entries(mergedOptions.endpoints)
          .filter(([, endpoint]) => endpoint.client == null && !endpoint.forwardCredentials && !endpoint.allowedRoutes)
          .map(([endpointId]) => endpointId)

    if (defaultClientEndpointIds.length) {
      logger.info(`Sending the requests of ${defaultClientEndpointIds.map(i => `\`${i}\``).join(', ')} straight to the API because SSR is disabled. Set \`client: false\` on an endpoint to keep it on the server proxy.`)
    }

    // Types are generated from the schema at build time, so it stays out of the runtime config the server bundle
    // carries.
    const resolvedOptions: APIPartyRuntimeConfig = {
      endpoints: Object.fromEntries(
        Object.entries(mergedOptions.endpoints).map(([endpointId, { schema, ...endpoint }]) => [
          endpointId,
          defaultClientEndpointIds.includes(endpointId) ? { ...endpoint, client: true } : endpoint,
        ]),
      ),
    }
    nuxt.options.runtimeConfig.apiParty = resolvedOptions

    if (!Object.keys(resolvedOptions.endpoints).length) {
      logger.warn('No API endpoints found. Nuxt API Party requires at least one defined endpoint.')
    }

    // Only a client endpoint sends its requests from the browser, and only what such a request needs is published.
    nuxt.options.runtimeConfig.public.apiParty = {
      endpoints: Object.fromEntries(
        Object.entries(resolvedOptions.endpoints)
          .filter(([, endpoint]) => endpoint.client)
          .map(([endpointId, { url, token, query, headers }]) => [endpointId, { url, token, query, headers }]),
      ),
    }

    const { resolve } = createResolver(import.meta.url)
    // Nuxt passes the transpiled directories on to Nitro to inline, so the server runtime is bundled as well.
    nuxt.options.build.transpile.push(resolve('runtime'))

    const relativeTo = (path: string) => relative(
      resolve(nuxt.options.rootDir, nuxt.options.buildDir, 'module'),
      resolve(path),
    )

    const endpointKeys = Object.keys(resolvedOptions.endpoints)
    const schemaEndpoints = Object.fromEntries(
      Object.entries(mergedOptions.endpoints)
        .filter(([, endpoint]) => hasSchema(endpoint)),
    )
    const schemaEndpointIds = Object.keys(schemaEndpoints)

    // Nitro serves `server/api` below `apiBaseURL`, and the proxy joins it there.
    const proxyRoute = joinURL(nuxt.options.nitro.apiBaseURL || '/api', '__api_party')

    addServerHandler({
      route: joinURL(proxyRoute, ':endpointId/**:path'),
      handler: resolve('runtime/server/proxy'),
    })
    // Duplicated server handler because empty path will respond with 404.
    addServerHandler({
      route: joinURL(proxyRoute, ':endpointId'),
      handler: resolve('runtime/server/proxy'),
    })

    nuxt.hooks.hook('nitro:config', (config) => {
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

      config.imports = defu(config.imports, {
        presets: [{
          from: `#${moduleName}/server`,
          imports: endpointKeys.map(getRawComposableName),
        }],
      })
    })

    addImportsSources({
      from: resolve(nuxt.options.buildDir, `module/${moduleName}`),
      imports: endpointKeys.flatMap(i => [getRawComposableName(i), getDataComposableName(i)]),
    })

    nuxt.options.alias[`#${moduleName}`] = resolve(nuxt.options.buildDir, `module/${moduleName}`)

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

    nuxt.options.optimization.keyedComposables.push(
      ...endpointKeys.map(i => ({
        name: getDataComposableName(i),
        argumentLength: 3,
        source: modTemplate.dst,
      })),
    )

    addTemplate({
      filename: `module/${moduleName}.d.ts`,
      getContents() {
        return `
// Generated by ${moduleName}
import type { ApiClient, OpenAPIClient, ApiClientFetchOptions, OpenAPIClientFetchOptions } from '${relativeTo('runtime/composables/$api')}'
import type { UseApiData, UseOpenAPIData, UseApiDataOptions, UseOpenAPIDataOptions } from '${relativeTo('runtime/composables/useApiData')}'
import type { OpenAPIEndpoint, OpenAPIPathMethods } from '${relativeTo('runtime/openapi')}'

${schemaEndpointIds.map(i => `
import type { paths as ${pascalCase(i)}Paths, components as ${pascalCase(i)}Components } from '#${moduleName}/${i}'
`.trimStart()).join('').trimEnd()}

export type { FetchResponseData, FetchResponseError, MethodOption, ParamsOption, RequestBodyOption, OpenAPIEndpoint, OpenAPIParameters, OpenAPIPathMethods } from '${relativeTo('runtime/openapi')}'
export type { ApiClient, OpenAPIClient, ApiClientFetchOptions, OpenAPIClientFetchOptions, UseApiData, UseOpenAPIData, UseApiDataOptions, UseOpenAPIDataOptions }

${endpointKeys.map(i => `
export declare const ${getRawComposableName(i)}: ${schemaEndpointIds.includes(i) ? `OpenAPIClient<${pascalCase(i)}Paths>` : 'ApiClient'}
export declare const ${getDataComposableName(i)}: ${schemaEndpointIds.includes(i) ? `UseOpenAPIData<${pascalCase(i)}Paths>` : 'UseApiData'}
`.trimStart()).join('').trimEnd()}

${schemaEndpointIds.map(i => generateTypeHelpers(i, { paths: `${pascalCase(i)}Paths`, components: `${pascalCase(i)}Components` })).join('\n\n')}
`.trimStart()
      },
    })

    addTemplate({
      filename: `module/${moduleName}.nitro.d.ts`,
      getContents() {
        return `
// Generated by ${moduleName}
import type { ServerApiClient, ServerOpenAPIClient } from '${relativeTo('runtime/server/$api')}'

${schemaEndpointIds.map(i => `
import type { paths as ${pascalCase(i)}Paths } from '#${moduleName}/${i}'
`.trimStart()).join('').trimEnd()}

${endpointKeys.map(i => `
export declare const ${getRawComposableName(i)}: ${schemaEndpointIds.includes(i) ? `ServerOpenAPIClient<${pascalCase(i)}Paths>` : 'ServerApiClient'}
`.trimStart()).join('').trimEnd()}
`.trimStart()
      },
    })

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
    'api-party:request': (options: FetchContext, endpointId: string) => HookResult
    'api-party:response': (options: Omit<FetchContext, 'response'> & { response: FetchResponse<any> }, endpointId: string) => HookResult
  }
}

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    // A server proxy request passes its \`event\`, a server-side \`$<name>\` call none, so \`event\` tells the two apart.
    'api-party:request': (options: FetchContext, event: H3Event | undefined, endpointId: string) => HookResult
    'api-party:response': (options: Omit<FetchContext, 'response'> & { response: FetchResponse<any> }, event: H3Event | undefined, endpointId: string) => HookResult
  }
}
`.trimStart()
      },
    })

    if (schemaEndpointIds.length) {
      addTemplate({
        filename: `module/${moduleName}.schema.d.ts`,
        async getContents() {
          return `
// Generated by ${moduleName}
${await generateOpenAPITypes(schemaEndpoints, { rootDir: nuxt.options.rootDir })}
`.trimStart()
        },
      })

      nuxt.hooks.hook('prepare:types', ({ references }) => {
        references.push({ path: resolve(nuxt.options.buildDir, `module/${moduleName}.schema.d.ts`) })
      })
    }

    addTemplate({
      filename: `module/${moduleName}.config.mjs`,
      getContents: () => `
export const proxyRoute = ${JSON.stringify(proxyRoute)}
export const allowPayloadCache = ${JSON.stringify(options.payloadCache)}
`.trimStart(),
    })

    addTemplate({
      filename: `module/${moduleName}.config.d.ts`,
      write: false, // Read through the virtual import alone, so no file has to exist.
      getContents: () => `
export declare const proxyRoute: string
export declare const allowPayloadCache: boolean
`.trimStart(),
    })

    if (nuxt.options.dev) {
      const schemaFiles = Object.values(schemaEndpoints)
        .map(({ schema }) => schema instanceof URL ? schema.href : schema)
        .filter((schema): schema is string => typeof schema === 'string' && !/^https?:\/\//.test(schema))
        .map(schema => schema.startsWith('file:') ? fileURLToPath(schema) : schema)
        .map(schema => resolve(nuxt.options.rootDir, schema))

      createSchemaWatcher(schemaFiles, nuxt)
    }
  },
})

function createSchemaWatcher(schemaFiles: string[], nuxt: Nuxt) {
  if (!schemaFiles.length) {
    return
  }

  // Nuxt's own builder watcher cannot stand in here: it only covers each layer's `app` and `server` directories,
  // and a path added through `nuxt.options.watch` restarts the dev server instead of refreshing the template.
  const watcher = watch(schemaFiles, nuxt.options.watchers.chokidar)
  const watcherCallback = () => {
    // Update the schema types template, which will trigger a types regeneration.
    // Ignore the file path since only the watched files will trigger this.
    updateTemplates({ filter: t => t.filename === `module/${name}.schema.d.ts` })
  }

  watcher.on('change', watcherCallback)
  watcher.on('add', watcherCallback)
  watcher.on('unlink', watcherCallback)

  // Close watcher on Nuxt `close`, otherwise reloads may leave orphaned watchers and duplicate events.
  nuxt.hooks.hook('close', () => watcher.close())
}
