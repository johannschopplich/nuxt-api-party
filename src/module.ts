import { defu } from 'defu'
import { camelCase, pascalCase } from 'scule'
import { addImportsSources, addServerHandler, addTemplate, createResolver, defineNuxtModule, useLogger } from '@nuxt/kit'
import type { QueryObject } from 'ufo'

export interface ModuleOptions {
  /**
   * API endpoints
   *
   * @remarks
   * Each key represents an endpoint ID, which is used to generate the composables. The value is an object with the following properties:
   * - `url`: The URL of the API endpoint
   * - `token`: The API token to use for the endpoint (optional)
   * - `query`: The query parameters to use for the endpoint (optional)
   * - `headers`: The headers to use for the endpoint (optional)
   *
   * @example
   * export default defineNuxtConfig({
   *   apiParty: {
   *     jsonPlaceholder: {
   *       url: 'https://jsonplaceholder.typicode.com'
   *       headers: {
   *         'X-Foo': 'bar',
   *         'Authorization': `Basic ${Buffer.from('foo:bar').toString('base64')}`
   *       }
   *     }
   *   }
   * })
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

    // Write options to public runtime config if client requests are enabled
    nuxt.options.runtimeConfig.public.apiParty = defu(
      nuxt.options.runtimeConfig.public.apiParty,
      options.allowClient
        ? options
        : { allowClient: false },
    )

    // Transpile runtime
    const { resolve } = createResolver(import.meta.url)
    nuxt.options.build.transpile.push(resolve('runtime'))

    // Inline module runtime in Nitro bundle
    // Needed to circumvent "cannot find module" error in `server.ts` for the `utils` import
    nuxt.hook('nitro:config', (config) => {
      config.externals = config.externals || {}
      config.externals.inline = config.externals.inline || []
      config.externals.inline.push(
        resolve('runtime/utils'),
        resolve('runtime/formData'),
      )
    })

    // Add Nuxt server route to proxy the API request server-side
    addServerHandler({
      route: '/api/__api_party/:endpointId',
      method: 'post',
      handler: resolve('runtime/server'),
    })

    const endpointKeys = Object.keys(nuxt.options.runtimeConfig.apiParty.endpoints)

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
