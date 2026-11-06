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
- `headers` – Headers sent with each request, as a record of strings.
- `client` – Whether every request goes straight to the API instead of through the server proxy. See [Client Endpoints](#client-endpoints).
- `forwardCredentials` – Whether the server proxy forwards the visitor's cookie and `Authorization` header to the API, and the API's `Set-Cookie` back. See [Credential Forwarding](/guides/credential-forwarding).
- `allowedRoutes` – Routes the server proxy may forward to this API. See [Allowed Routes](/guides/allowed-routes).
- `schema` – [OpenAPI document](https://swagger.io/resources/open-api) to generate types from: a file path, a `file:`, `http:` or `https:` URL, the parsed document, or an async function resolving to it. See [OpenAPI Integration](/guides/openapi-integration).

`token`, `query` and `headers` are the endpoint credentials. The [server proxy](/advanced/how-it-works) adds them to each request on the server, so they never reach the browser – unless the endpoint is a client endpoint.

**Default Value**: `{}`

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

## Client Endpoints

An endpoint with `client: true` sends every request straight to the API – from the browser, and from the server during SSR – and never through the server proxy:

```ts
export default defineNuxtConfig({
  apiParty: {
    endpoints: {
      publicApi: {
        url: 'https://api.example.com',
        client: true
      }
    }
  }
})
```

::: warning Endpoint Credentials Are Public
The browser has to send the endpoint credentials itself, so a client endpoint's `url`, `token`, `query` and `headers` are written into the public runtime config, readable in the delivered HTML. Reserve `client: true` for APIs whose credentials may be public, and expect the API to answer CORS requests from your origin.
:::

During SSR, a request to a client endpoint leaves the server without the visitor's cookie or `Authorization` header.

With `ssr: false`, there is often no server to proxy through, so every endpoint defaults to `client: true`. Two exceptions keep the server proxy: an endpoint with `client: false`, and one that sets `forwardCredentials` or `allowedRoutes`, both of which only the proxy acts on.

To send some calls of one API through the proxy and others straight to it, configure the API twice, as two endpoints.

## Environment Variables

Nuxt overrides [runtime config](https://nuxt.com/docs/guide/going-further/runtime-config#environment-variables) values from environment variables at runtime, for keys that exist at build time:

```bash
NUXT_API_PARTY_ENDPOINTS_{ENDPOINT_ID}_{OPTION}
```

The browser reads a client endpoint from the public runtime config, so its overrides take the `PUBLIC` prefix – `NUXT_PUBLIC_API_PARTY_ENDPOINTS_PUBLIC_API_URL` for the example above. Server imports read the private runtime config, so a client endpoint that server code calls, too, needs both variables.

## Options That Fail the Build

The module refuses to start on an option that no longer exists or that contradicts another, and names each in its error:

- `server`, `client`, `openAPITS` and `payloadCache` at the module level.
- `allowedUrls`, `cookies` and `openAPITS` on an endpoint.
- `client: true` together with `forwardCredentials` – a client endpoint skips the server proxy, so there are no visitor credentials to forward.
- `client: true` together with `allowedRoutes` – a client endpoint publishes its token and skips the server proxy, so the allowed routes protect nothing.

See the [migration guide](/advanced/migration#from-v4-to-v5) for what replaces each removed option.

## Type Declarations

<<< @/../src/module.ts#options
