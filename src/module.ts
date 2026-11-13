import type { HookResult, Nuxt } from '@nuxt/schema'
import type { OpenAPIDocumentSource } from 'apiful/openapi/generate'
import type { QueryObject } from 'ufo'
import type { OpenAPITypes } from './openapi'
import type { AllowedRoute } from './runtime/types'
import { fileURLToPath } from 'node:url'
import { addImportsSources, addServerHandler, addServerImports, addServerTemplate, addTemplate, addTypeTemplate, createResolver, defineNuxtModule, updateTemplates } from '@nuxt/kit'
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
  client?: boolean
  forwardCredentials?: boolean
  allowedRoutes?: AllowedRoute[]
  schema?: OpenAPIDocumentSource
}
// #endregion endpoints

export interface ModuleOptions {
  /**
   * Each key represents an endpoint ID, which is used to generate the composables. The value is an object with the following properties:
   * - `url` (required): Base URL of the API
   * - `token` (optional): Bearer token for authentication
   * - `query` (optional): Default query parameters to send with each request
   * - `headers` (optional): Default headers to send with each request
   * - `client` (optional): Whether every request goes straight to the API, from the browser and during SSR, instead of through the server proxy. A client endpoint's URL and credentials are published to the browser. Defaults to `true` where Nuxt SSR is disabled and the endpoint sets neither `forwardCredentials` nor `allowedRoutes`.
   * - `forwardCredentials` (optional): Whether the server proxy forwards the visitor's cookie and `Authorization` header to the API, and the API's `Set-Cookie` back
   * - `allowedRoutes` (optional): Routes the [server proxy may forward](https://nuxt-api-party.byjohann.dev/guides/allowed-routes)
   * - `schema` (optional): [OpenAPI](https://swagger.io/resources/open-api) document for [type generation](https://nuxt-api-party.byjohann.dev/guides/openapi-integration) – a file path, a `file:` or http(s) URL, the document itself, or an async function resolving to it
   *
   * @example
   * export default defineNuxtConfig({
   *   apiParty: {
   *     endpoints: {
   *       jsonPlaceholder: {
   *         url: 'https://jsonplaceholder.typicode.com',
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

export default defineNuxtModule<ModuleOptions>().with({
  meta: {
    name,
    configKey: 'apiParty',
    compatibility: {
      nuxt: '>=4.4.0',
    },
  },
  defaults: {
    endpoints: {},
  },
  async setup(options, nuxt) {
    const moduleName = name
    const getRawComposableName = (endpointId: string) => `$${camelCase(endpointId)}`
    const getDataComposableName = (endpointId: string) => `use${pascalCase(endpointId)}Data`
    // Decides per endpoint whether its raw and its data composable are typed, so the two never diverge.
    const getComposableTypes = (endpointId: string, typedEndpointIds: string[]) => typedEndpointIds.includes(endpointId)
      ? { raw: `OpenAPIClient<${pascalCase(endpointId)}Paths>`, data: `UseOpenAPIData<${pascalCase(endpointId)}Paths>` }
      : { raw: 'ApiClient', data: 'UseApiData' }
    // Exported from the template only because Nuxt compiles a `createUseFetch` call in an export declaration alone.
    const getFetchComposableName = (endpointId: string) => `_use${pascalCase(endpointId)}Fetch`

    await nuxt.callHook('api-party:extend', options)

    // Annotated because `defu`'s return type widens the endpoint values to `unknown`.
    const mergedOptions: ModuleOptions = defu(nuxt.options.runtimeConfig.apiParty, options)

    // The runtime config takes endpoints of its own, so a removed option may hide there too.
    assertValidOptions(mergedOptions)

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
          defaultClientEndpointIds.includes(endpointId)
            ? { ...endpoint, client: true }
            : endpoint,
        ]),
      ),
    }
    nuxt.options.runtimeConfig.apiParty = resolvedOptions

    if (!Object.keys(resolvedOptions.endpoints).length) {
      logger.warn('No endpoints configured. Nuxt API Party needs at least one endpoint.')
    }

    // Only a client endpoint's requests go from the browser to the API itself, and only what such a request needs is published.
    nuxt.options.runtimeConfig.public.apiParty = {
      endpoints: Object.fromEntries(
        Object.entries(resolvedOptions.endpoints)
          .filter(([, endpoint]) => endpoint.client)
          .map(([endpointId, { url, token, query, headers }]) => [
            endpointId,
            { url, token, query, headers },
          ]),
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

    // Loads the schemas once across templates, and again only after a watched schema file changes.
    let openAPITypes: Promise<OpenAPITypes> | undefined
    const loadOpenAPITypes = () => openAPITypes ??= generateOpenAPITypes(schemaEndpoints, { rootDir: nuxt.options.rootDir })

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

    // The alias gives the server imports their types; the virtual module of the same name provides their code.
    nuxt.options.nitro.alias ||= {}
    nuxt.options.nitro.alias[`#${moduleName}/server`] = resolve(nuxt.options.buildDir, `module/${moduleName}.nitro`)

    addServerTemplate({
      filename: `#${moduleName}/server`,
      getContents: () => `
import { _$api } from '${resolve('runtime/server/$api')}'
${endpointKeys.map(i => `
export const ${getRawComposableName(i)} = (...args) => _$api('${i}', ...args)
`.trimStart()).join('')}`.trimStart(),
    })

    addServerImports(endpointKeys.map(i => ({
      name: getRawComposableName(i),
      from: `#${moduleName}/server`,
    })))

    addImportsSources({
      from: resolve(nuxt.options.buildDir, `module/${moduleName}`),
      imports: endpointKeys.flatMap(i => [
        getRawComposableName(i),
        getDataComposableName(i),
      ]),
    })

    nuxt.options.alias[`#${moduleName}`] = resolve(nuxt.options.buildDir, `module/${moduleName}`)

    const modTemplate = addTemplate({
      filename: `module/${moduleName}.mjs`,
      getContents() {
        return `
import { createUseFetch } from '#app/composables/fetch'
import { _$api, createEndpointFetch } from '${resolve('runtime/composables/$api')}'
import { _useApiData } from '${resolve('runtime/composables/useApiData')}'
${endpointKeys.map(i => `
export const ${getRawComposableName(i)} = (...args) => _$api('${i}', ...args)
export const ${getFetchComposableName(i)} = createUseFetch(() => ({ ...createEndpointFetch('${i}'), _functionName: '${getDataComposableName(i)}' }))
export const ${getDataComposableName(i)} = (...args) => _useApiData(${getFetchComposableName(i)}, ...args)
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

    const typesTemplate = addTemplate({
      filename: `module/${moduleName}.d.ts`,
      async getContents() {
        const { typedEndpointIds } = await loadOpenAPITypes()

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
export declare const ${getRawComposableName(i)}: ${getComposableTypes(i, typedEndpointIds).raw}
export declare const ${getDataComposableName(i)}: ${getComposableTypes(i, typedEndpointIds).data}
`.trimStart()).join('').trimEnd()}

${schemaEndpointIds.map(i => generateTypeHelpers(i, { paths: `${pascalCase(i)}Paths`, components: `${pascalCase(i)}Components` })).join('\n\n')}
`.trimStart()
      },
    })

    const nitroTypesTemplate = addTemplate({
      filename: `module/${moduleName}.nitro.d.ts`,
      async getContents() {
        const { typedEndpointIds } = await loadOpenAPITypes()

        return `
// Generated by ${moduleName}
import type { ApiClient, OpenAPIClient } from '${relativeTo('runtime/composables/$api')}'

${typedEndpointIds.map(i => `
import type { paths as ${pascalCase(i)}Paths } from '#${moduleName}/${i}'
`.trimStart()).join('').trimEnd()}

${endpointKeys.map(i => `
export declare const ${getRawComposableName(i)}: ${getComposableTypes(i, typedEndpointIds).raw}
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
    'api-party:request': (ctx: FetchContext, endpointId: string) => HookResult
    'api-party:response': (ctx: Omit<FetchContext, 'response'> & { response: FetchResponse<any> }, endpointId: string) => HookResult
  }
}

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    // A server proxy request passes its \`event\`, a server import none, so \`event\` tells the two apart.
    'api-party:request': (ctx: FetchContext, event: H3Event | undefined, endpointId: string) => HookResult
    'api-party:response': (ctx: Omit<FetchContext, 'response'> & { response: FetchResponse<any> }, event: H3Event | undefined, endpointId: string) => HookResult
  }
}
`.trimStart()
      },
    }, { nitro: true, nuxt: true })

    const schemaTypesFilename = `module/${moduleName}.schema.d.ts` as const
    if (schemaEndpointIds.length) {
      addTypeTemplate({
        filename: schemaTypesFilename,
        async getContents() {
          return `
// Generated by ${moduleName}
${(await loadOpenAPITypes()).declarations}
`.trimStart()
        },
      }, { nitro: true, nuxt: true })
    }

    addTemplate({
      filename: `module/${moduleName}.config.mjs`,
      getContents: () => `
export const proxyRoute = ${JSON.stringify(proxyRoute)}
`.trimStart(),
    })

    addTemplate({
      filename: `module/${moduleName}.config.d.ts`,
      getContents: () => `
export declare const proxyRoute: string
`.trimStart(),
    })

    if (nuxt.options.dev) {
      const schemaFiles = Object.values(schemaEndpoints)
        .map(({ schema }) => schema instanceof URL
          ? schema.href
          : schema)
        .filter((schema): schema is string => typeof schema === 'string' && !/^https?:\/\//.test(schema))
        .map(schema => schema.startsWith('file:')
          ? fileURLToPath(schema)
          : schema)
        .map(schema => resolve(nuxt.options.rootDir, schema))

      const schemaReaderFilenames = [typesTemplate.filename, nitroTypesTemplate.filename, schemaTypesFilename]

      createSchemaWatcher(schemaFiles, schemaReaderFilenames, nuxt, () => {
        openAPITypes = undefined
      })
    }
  },
})

function createSchemaWatcher(schemaFiles: string[], schemaReaderFilenames: string[], nuxt: Nuxt, onChange: () => void) {
  if (!schemaFiles.length) {
    return
  }

  // Nuxt's own builder watcher cannot stand in here: it only covers each layer's `app` and `server` directories,
  // and a path added through `nuxt.options.watch` restarts the dev server instead of refreshing the template.
  const watcher = watch(schemaFiles, nuxt.options.watchers.chokidar)
  const watcherCallback = () => {
    onChange()
    // Ignore the file path since only the watched files will trigger this.
    updateTemplates({
      filter: t => schemaReaderFilenames.includes(t.filename),
    })
  }

  watcher.on('change', watcherCallback)
  watcher.on('add', watcherCallback)
  watcher.on('unlink', watcherCallback)

  // Close watcher on Nuxt `close`, otherwise reloads may leave orphaned watchers and duplicate events.
  nuxt.hooks.hook('close', () => watcher.close())
}
