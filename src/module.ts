import { defu } from 'defu'
import { camelCase, pascalCase } from 'scule'
import { addImportsSources, addServerHandler, addTemplate, createResolver, defineNuxtModule, useLogger } from '@nuxt/kit'
import type { QueryObject } from 'ufo'

export interface ModuleOptions {
  /**
   * API name used for composables
   *
   * @remarks
   * For example, if you set it to `foo`, the composables will be called `$foo` and `useFooData`
   */
  name?: string

  /**
   * API base URL
   *
   * @default process.env.API_PARTY_BASE_URL
   */
  url?: string

  /**
   * Optional API token for bearer authentication
   *
   * @remarks
   * You can set a custom header with the `headers` module option instead
   *
   * @default process.env.API_PARTY_TOKEN
   */
  token?: string

  /**
   * Custom query parameters sent with every request to the API
   */
  query?: QueryObject

  /**
   * Custom headers sent with every request to the API
   *
   * @remarks
   * Add authorization headers if you want to use a custom authorization method
   *
   * @example
   * export default defineNuxtConfig({
   *   apiParty: {
   *     headers: {
   *       'Custom-Api-Header': 'foo',
   *       'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
   *     }
   *   }
   * })
   *
   * @default {}
   */
  headers?: Record<string, string>

  /**
   * Multiple API endpoints
   *
   * @remarks
   * This will create multiple API composables for the given endpoint configurations. You can keep the default endpoint as well.
   *
   * @default {}
   */
  endpoints?: Record<
    string,
    {
      url: string
      token?: string
      query?: QueryObject
      headers?: Record<string, string>
    }
 >
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
    name: undefined,
    url: process.env.API_PARTY_BASE_URL as string,
    token: process.env.API_PARTY_TOKEN as string,
    query: undefined,
    headers: undefined,
    endpoints: {},
  },
  setup(options, nuxt) {
    const logger = useLogger('nuxt-api-party')
    const hasMultipleEndpoints = Object.keys(options.endpoints!).length > 0
    const getRawComposableName = (endpointId: string) => `$${camelCase(endpointId)}`
    const getDataComposableName = (endpointId: string) => `use${pascalCase(endpointId)}Data`

    if (!hasMultipleEndpoints && !options.name)
      logger.error('No name provided for the API. Please set the `name` option.')

    if (options.name) {
      // Make sure API base URL is set
      if (!options.url)
        logger.error('Missing `API_PARTY_BASE_URL` in `.env` file')

      // Make sure authentication credentials are set
      if (!options.token && !options.headers && !options.query) {
        logger.warn(
          'Missing `API_PARTY_TOKEN` in `.env` file for bearer authentication and custom headers in module options. Are you sure your API doesn\'t require authentication? If so, you may not need this module.',
        )
      }

      // Add default endpoint to collection of endpoints
      options.endpoints![options.name] = {
        url: options.url!,
        token: options.token,
        query: options.query,
        headers: options.headers,
      }
    }

    // Private runtime config
    nuxt.options.runtimeConfig.apiParty = defu(
      nuxt.options.runtimeConfig.apiParty,
      options,
    )

    // Transpile runtime
    const { resolve } = createResolver(import.meta.url)
    nuxt.options.build.transpile.push(resolve('runtime'))

    // Add Nuxt server route to proxy the API request server-side
    addServerHandler({
      route: '/api/__api_party__/:endpointId',
      method: 'post',
      handler: resolve('runtime/server/api/handler'),
    })

    const endpointKeys = Object.keys(options.endpoints!)

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

    // Add types for generated composables
    addTemplate({
      filename: 'api-party.d.ts',
      getContents() {
        return `
import type { $Api } from '${resolve('runtime/composables/$api')}'
import type { UseApiData } from '${resolve('runtime/composables/useApiData')}'
${endpointKeys.map(i => `
export declare const ${getRawComposableName(i)}: $Api
export declare const ${getDataComposableName(i)}: UseApiData
`.trimStart()).join('')}`.trimStart()
      },
    })
  },
})
