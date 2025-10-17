# Module Configuration

Configure Nuxt API Party to your needs in the `apiParty` key of your Nuxt configuration. The module options are fully typed.

::: code-group
```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    endpoints: {
      // ... Your endpoints go here
    }
  }
})
```
:::

## `apiParty.endpoints`

Main module configuration for your API endpoints. Each key is an endpoint ID used to generate composables. The value is an object with the following properties:

- `url` (required): Base URL of the API
- `token` (optional): Bearer token for authentication
- `query` (optional): Default query parameters to send with each request
- `headers` (optional): Default headers sent with each request
- `cookies` (optional): Whether to forward cookies in requests
- `allowedUrls` (optional): URLs allowed for [dynamic backend switching](/guides/dynamic-backend-url)
- `schema` (optional): [OpenAPI Schema](https://swagger.io/resources/open-api) schema URL or file path for [type generation](/guides/openapi-integration)
- `openAPITS` (optional): Endpoint-specific configuration options for [`openapi-typescript`](https://openapi-ts.dev/node/#options). Will override the global `openAPITS` options if provided.

**Default value**: `{}`

::: info Placeholders
Composables are generated based on your API endpoint ID. For example, an endpoint `jsonPlaceholder` generates `useJsonPlaceholderData` and `$jsonPlaceholder`.
:::

**Type Declaration:**

<<< @/../src/module.ts#endpoints

**Example:**

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

Global [configuration options](https://openapi-ts.dev/node/#options) for `openapi-typescript`. Options set here apply to every endpoint schema but can be overridden per endpoint.

## `apiParty.experimental`

These feature flags enable experimental features which change the default behavior of the module that may become the default in the future.

### `enableAutoKeyInjection`

When enabled, Nuxt generates a unique key for each composable call based on its location in the code, similar to `useFetch` and `useAsyncData`.

To share data between multiple calls to the same resource, provide a `key` option to the composable call. The same restrictions apply as with `useFetch` and `useAsyncData`: each call must share the same `pick`, `transform`, and `getCachedData` options.

### `enablePrefixedProxy`

When enabled, globally enables direct API proxying using h3's `requestProxy` utility.

By default, all API requests go through an internal `POST` endpoint that passes the request to the backend service. This can be confusing when inspecting the browser network tab if you don't expect it. Since it uses a `POST` request, it isn't compatible with cache control.

Enable this option if you prefer matching HTTP methods or want to use cache control.

### `disableClientPayloadCache`

When enabled, disables client-side payload cache for all generated composables.

This has the same effect as setting `cache: false` in each composable call and enforces it globally. Additionally, in-memory caching logic is completely removed from composables, resulting in smaller bundle sizes.

### `enableSchemaFileWatcher`

::: tip
This option is enabled by default in development mode.
:::

When enabled, watches local OpenAPI schema files using `chokidar`.

Changes to local schema files automatically regenerate types. When disabled, restart the Nuxt dev server to pick up changes to local schema files. Has no effect on remote schemas.

## Type Declaration

<<< @/../src/module.ts#options
