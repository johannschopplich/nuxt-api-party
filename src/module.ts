import { defu } from 'defu'
import { camelCase, pascalCase } from 'scule'
import { addImportsSources, addServerHandler, addTemplate, createResolver, defineNuxtModule, useLogger } from '@nuxt/kit'
import { apiServerRoute } from './runtime/utils'

export interface ModuleOptions {
  /**
   * API name used for composables
   * For example, if you set it to `foo`, the composables will be called `$foo` and `useFooData`
   * @default 'party'
   */
  name?: string

  /**
   * API base URL
   * @default 'process.env.API_PARTY_BASE_URL'
   */
  url?: string

  /**
   * Optional API token for bearer authentication
   * You can set a custom header with the `headers` module option instead
   * @default 'process.env.API_PARTY_TOKEN'
   */
  token?: string

  /**
   * Custom headers sent with every request to the API
   * Add authorization headers if you want to use a custom authorization method
   * @default '{}'
   */
  headers?: Record<string, string>
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
    name: 'party',
    url: process.env.API_PARTY_BASE_URL as string,
    token: process.env.API_PARTY_TOKEN as string,
    headers: {},
  },
  async setup(options, nuxt) {
    const logger = useLogger('nuxt-api-party')

    // Make sure API base URL is set
    if (!options.url)
      logger.error('Missing `API_PARTY_BASE_URL` in `.env`')

    // Make sure authentication credentials are set
    if (!options.token || !options.headers?.authorization)
      logger.warn('Missing `API_PARTY_TOKEN` in `.env` for bearer authentication and `Authorization` header in the module options. Are you sure your API doesn\'t require authentication? If so, you may not need this module.')

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
      route: apiServerRoute,
      method: 'post',
      handler: resolve('runtime/server/api/handler'),
    })

    const rawComposableName = `$${camelCase(options.name)}`
    const dataComposableName = `use${pascalCase(options.name)}Data`

    addImportsSources({
      from: '#build/api-party',
      imports: [rawComposableName, dataComposableName],
    })

    // Add generated composables
    addTemplate({
      filename: 'api-party.mjs',
      getContents() {
        return `
import { $api } from '${resolve('runtime/composables/$api')}'
import { useApiData } from '${resolve('runtime/composables/useApiData')}'
export function ${rawComposableName}(uri, opts = {}) {
  return $api(uri, opts)
}
export function ${dataComposableName}(uri, opts = {}) {
  return useApiData(uri, opts)
}
`.trimStart()
      },
    })

    // Add types for generated composables
    addTemplate({
      filename: 'api-party.d.ts',
      getContents() {
        return `
export declare const ${rawComposableName}: typeof import('${resolve('runtime/composables/$api')}')['$api']
export declare const ${dataComposableName}: typeof import('${resolve('runtime/composables/useApiData')}')['useApiData']
`.trimStart()
      },
    })
  },
})
