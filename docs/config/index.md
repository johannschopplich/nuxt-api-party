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

<<< @/../src/module.ts#endpoints

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

## `apiParty.experimental`

These feature flags enable experimental features which change the default behavior of the module that may become the default in the future.

### `enableAutoKeyInjection`

When set to `true`, this experimental option will instruct nuxt to generate a unique key for each composable call based on its location in the code, similar to `useFetch` and `useAsyncData`.

As a consequence, in order to share data between multiple calls to the same resource, you will need to provide a `key` option to the composable call. The same restrictions apply as with `useFetch` and `useAsyncData`, meaning that each call must share the same `pick`, `transform`, and `getCachedData` options.

### `enablePrefixedProxy`

When set to `true`, this experimental option will globally enable direct API proxying using h3's `requestProxy` utility.

By default, all API requests go through an internal `POST` endpoint which passes the request to the backend service. This can be confusing when looking at the browser network debug tool if you don't expect it. Also as it uses a `POST` request, it isn't compatible with cache control.

Enable this option if this behavior is undeired or you want to take advantage of cache control.

### `disableClientPayloadCache`

When set to `true`, this experimental option will disable the client-side payload cache for all generated composables.

This has the same effect as setting `cache: false` in each individual composable call and enforces it globally. Additionally, the logic for in-memory caching is completely removed from the composables, resulting in smaller bundle sizes.

## Type Declaration

<<< @/../src/module.ts#options
