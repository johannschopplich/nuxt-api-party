# Module Configuration

Adapt Nuxt API Party to your needs with the following options in your `nuxt.config.ts` file:

```ts
// `nuxt.config.ts`
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    endpoints: {
      // ... your API endpoints
    }
  }
})
```

## `apiParty.endpoints`

Main module configuration for your API endpoints. Each key represents an endpoint ID, which is used to generate the composables. The value is an object with the following properties:

- `url`: The URL of the API endpoint
- `token`: The API token to use for the endpoint (optional)
- `query`: Query parameters to send with each request (optional)
- `headers`: Headers to send with each request (optional)
- `cookies`: Whether to send cookies with each request (optional)
- `allowedUrls`: A list of allowed URLs to change the [backend URL at runtime](/guide/dynamic-backend-url) (optional)
- `schema`: A URL, file path, or object representing an [OpenAPI Schema](https://swagger.io/resources/open-api) used to [generate types](/guide/openapi-types) (optional)
- `openAPITS`: [Configuration options](https://openapi-ts.pages.dev/node/#options) for `openapi-typescript`. Options defined here will override the global `openAPITS`

::: info
The composables are generated based on your API endpoint ID. For example, if you were to call an endpoint `jsonPlaceholder`, the composables will be called `useJsonPlaceholderData` and `$jsonPlaceholder`.
:::

Default value: `{}`

**Type**

```ts
interface EndpointConfiguration {
  url: string
  token?: string
  query?: QueryObject
  headers?: HeadersInit
  cookies?: boolean
  allowedUrls?: string[]
  schema?: string | OpenAPI3
  openAPITS?: OpenAPITSOptions
}

type ApiPartyEndpoints = Record<string, EndpointConfiguration> | undefined
```

**Example**

```ts
export default defineNuxtConfig({
  apiParty: {
    endpoints: {
      // Will generate `$jsonPlaceholder` and `useJsonPlaceholderData`
      jsonPlaceholder: {
        url: process.env.JSON_PLACEHOLDER_API_BASE_URL!,
        token: process.env.JSON_PLACEHOLDER_API_TOKEN!
      },
      // Will generate `$cms` and `useCmsData`
      cms: {
        url: process.env.CMS_API_BASE_URL!,
        headers: {
          Authorization: `Basic ${globalThis.btoa(`${process.env.CMS_API_USERNAME}:${process.env.CMS_API_PASSWORD}`)}`
        }
      },
      // Will generate `$petStore` and `usePetStore` as well as types for each path
      petStore: {
        url: process.env.PET_STORE_API_BASE_URL!,
        schema: `${process.env.PET_STORE_API_BASE_URL!}/openapi.json`
      }
    }
  }
})
```

## `apiParty.openAPITS`

The global [configuration options](https://openapi-ts.pages.dev/node/#options) for `openapi-typescript`. Options set here will be applied to every endpoint schema, but can be overridden by individual endpoint options.

## Type Declaration

```ts
interface EndpointConfiguration {
  url: string
  token?: string
  query?: QueryObject
  headers?: HeadersInit
  cookies?: boolean
  allowedUrls?: string[]
  schema?: string | URL | OpenAPI3 | (() => Promise<OpenAPI3>)
  openAPITS?: OpenAPITSOptions
}

interface ModuleOptions {
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
     * The API base path for the Nuxt server handler
     *
     * @default '__api_party'
     */
    basePath?: string
  }
}
```
