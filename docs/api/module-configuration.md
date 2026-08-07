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

The APIs the module generates composables for. Each key is an endpoint ID and names the pair it yields, so `jsonPlaceholder` gives you `$jsonPlaceholder` and `useJsonPlaceholderData`.

`url` is the base URL every request is resolved against, and the only required option. The rest are optional:

- `token` – Bearer token sent with each request.
- `query` – Query parameters added to each request.
- `headers` – Headers sent with each request.
- `cookies` – Whether the browser's cookie travels on to this API. See [Cookie Forwarding](/guides/cookie-forwarding).
- `allowedUrls` – Base URLs a request may switch to at runtime. See [Dynamic Backend URL](/guides/dynamic-backend-url).
- `schema` – URL or file path of an [OpenAPI schema](https://swagger.io/resources/open-api) to infer types from. See [OpenAPI Integration](/guides/openapi-integration).
- `openAPITS` – [`openapi-typescript` options](https://openapi-ts.dev/node/#options) for this endpoint's schema, overriding the global `openAPITS`.

`token`, `query` and `headers` are attached by the server handler, so they never reach the browser – but only in the default `'wrapped'` proxy mode. See [`proxyMode`](#proxymode).

**Default value**: `{}`

**Type Declarations**

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
      // Will generate `$petStore` and `usePetStoreData` as well as types for each path
      petStore: {
        url: process.env.PET_STORE_API_BASE_URL!,
        schema: `${process.env.PET_STORE_API_BASE_URL!}/openapi.json`
      }
    }
  }
})
```

## `apiParty.client`

Whether composables may bypass the proxy and call your API straight from the browser. Doing so exposes the endpoint's credentials, so it is off by default.

- `false` – Every request goes through the server proxy.
- `true` or `'allow'` – A composable call may opt in with `client: true`.
- `'always'` – Every request is made client-side unless a call opts out.

**Default value**: `false`, or `'always'` when Nuxt runs with `ssr: false`, where there is no server to proxy through.

See [Client Requests](/api/dollarfetch-like#client-requests) for what a call looks like.

## `apiParty.openAPITS`

Global [configuration options](https://openapi-ts.dev/node/#options) for `openapi-typescript`. Options set here apply to every endpoint schema but can be overridden per endpoint.

## `apiParty.server`

### `basePath`

The path segment the module's server routes live under, below `/api`. Change it if `__api_party` collides with a route of your own.

**Default value**: `'__api_party'`

### `proxyMode`

How the server handler forwards a request to your API.

- `'wrapped'` – Every call becomes a `POST` request that carries the original request in its body.
- `'passthrough'` – The original request is mirrored: path, method, headers, query and body travel as they are, through h3's `sendProxy` utility.

Choose `'passthrough'` when you want the browser's network tab to match the upstream request, or when you need HTTP cache control – a `POST` wrapper cannot be cached.

::: warning `'passthrough'` Adds No Credentials
The name is literal: the request travels as it stands, and nothing from the endpoint configuration is attached. The endpoint's `token`, `headers` and `query` are applied by the `'wrapped'` handler only. Authenticate the upstream service in a [request hook](/guides/hooks) instead.
:::

**Default value**: `'wrapped'`

## `apiParty.payloadCache`

Whether a response may be cached in the Nuxt payload, keyed by the request. Turning it off also drops the caching logic from the client bundle.

An individual call opts out with `payloadCache: false`.

**Default value**: `true`

## `apiParty.autoKeyInjection`

Whether every `useMyApiData` call gets a build-time key derived from its position in the source, the way Nuxt does for `useFetch` and `useAsyncData`.

Each call site then owns its async data, so two components asking for the same resource no longer collide over differing `transform`, `pick` or `default` options. They still share the underlying request. To put two call sites back on one shared instance, give them the same `key` – the same restrictions apply as with Nuxt's own composables.

**Default value**: `true`

## Type Declarations

<<< @/../src/module.ts#options
