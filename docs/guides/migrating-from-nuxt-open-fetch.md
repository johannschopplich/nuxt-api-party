# Migrating From nuxt-open-fetch

[nuxt-open-fetch](https://github.com/Norbiros/nuxt-open-fetch) and Nuxt API Party both generate typed composables from an OpenAPI document. This guide maps a nuxt-open-fetch 0.13 setup onto Nuxt API Party, option by option.

Two differences shape the move:

- **Where requests go.** nuxt-open-fetch publishes each client's `baseURL`, `headers` and `query` to the public runtime config, and the browser calls the API directly. Nuxt API Party sends requests through a [server proxy](/essentials/how-it-works) by default, so the endpoint credentials stay on the server and CORS never applies. A [client endpoint](/guides/client-endpoints) keeps the old behavior.
- **What generates the types.** nuxt-open-fetch runs `openapi-typescript` and takes its options. Nuxt API Party generates the types with [APIful](https://apiful.land), which takes none.

## Swap the Module

```bash
npm uninstall nuxt-open-fetch
npx nuxt module add api-party
```

Remove `openapi-typescript` as well, unless something else in your app uses it.

## Move the Configuration

Each client under `openFetch.clients` becomes an endpoint under `apiParty.endpoints`, with the same name:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-open-fetch'], // [!code --]
  modules: ['nuxt-api-party'], // [!code ++]

  openFetch: { // [!code --]
    clients: { // [!code --]
      pets: { // [!code --]
        baseURL: 'https://petstore3.swagger.io/api/v3', // [!code --]
        headers: { 'X-Api-Key': process.env.PETS_API_KEY! } // [!code --]
      } // [!code --]
    } // [!code --]
  }, // [!code --]
  apiParty: { // [!code ++]
    endpoints: { // [!code ++]
      pets: { // [!code ++]
        url: 'https://petstore3.swagger.io/api/v3', // [!code ++]
        headers: { 'X-Api-Key': process.env.PETS_API_KEY! }, // [!code ++]
        schema: './openapi/pets/openapi.yaml' // [!code ++]
      } // [!code ++]
    } // [!code ++]
  } // [!code ++]
})
```

| nuxt-open-fetch               | Nuxt API Party                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| `clients.{name}.baseURL`      | `endpoints.{name}.url`                                                                        |
| `clients.{name}.headers`      | `endpoints.{name}.headers`, a record of strings                                               |
| `clients.{name}.query`        | `endpoints.{name}.query`                                                                      |
| `clients.{name}.schema`       | `endpoints.{name}.schema`                                                                     |
| `openapi/{name}/openapi.yaml` | No discovery – set `schema` to the file                                                       |
| `openAPITS`                   | No replacement – the generator takes no options                                               |
| `disableNuxtPlugin`           | No replacement – the composables need no plugin                                               |
| `disableNitroPlugin`          | No replacement – [server imports](/api/server-imports) need no plugin                         |

A bearer token goes into `token` rather than an `Authorization` header in `headers`; both stay on the server.

nuxt-open-fetch finds a schema at `openapi/{name}/openapi.{json,yaml,yml}` in each layer. Nuxt API Party reads only the `schema` you set, and resolves a relative path against the root directory of the app. A layer that brings its own schema passes an absolute path:

```ts
// `layers/pets/nuxt.config.ts`
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  apiParty: {
    endpoints: {
      pets: {
        url: 'https://petstore3.swagger.io/api/v3',
        schema: fileURLToPath(new URL('./openapi/pets/openapi.yaml', import.meta.url))
      }
    }
  }
})
```

### Environment Variables

The runtime config key changes with the module. `NUXT_PUBLIC_OPEN_FETCH_PETS_BASE_URL` becomes `NUXT_API_PARTY_ENDPOINTS_PETS_URL`, and `NUXT_PUBLIC_API_PARTY_ENDPOINTS_PETS_URL` for a client endpoint. Nuxt overrides only keys that exist at build time, so set `url` in the configuration, too.

### Keep Calling the API From the Browser

An API that only accepts the visitor's own credentials, or that you want the browser to call directly as before, becomes a client endpoint:

```ts
export default defineNuxtConfig({
  apiParty: {
    endpoints: {
      pets: {
        url: 'https://petstore3.swagger.io/api/v3',
        client: true
      }
    }
  }
})
```

Its `url`, `token`, `query` and `headers` are public, as they were with nuxt-open-fetch. To keep the server proxy and still send the visitor's cookie or `Authorization` header, set [`forwardCredentials`](/guides/credential-forwarding) instead.

## Rename the Composables

| nuxt-open-fetch                    | Nuxt API Party                                  |
| ---------------------------------- | ----------------------------------------------- |
| `usePets(path, opts)`              | `usePetsData(path, opts)`                       |
| `useLazyPets(path, opts)`          | `usePetsData(path, { ...opts, lazy: true })`    |
| `useNuxtApp().$pets(path, opts)`   | `$pets(path, opts)`, auto-imported              |
| `useNitroApp().$pets(path, opts)`  | `$pets(path, opts)`, auto-imported in Nitro     |
| `createOpenFetch`, `createUseOpenFetch` | No replacement – configure another endpoint |

```ts
const { data } = await usePets('/pet/{petId}', { // [!code --]
  path: { petId: 1 } // [!code --]
}) // [!code --]
const { data } = await usePetsData('/pet/{petId}', { // [!code ++]
  path: { petId: 1 } // [!code ++]
}) // [!code ++]
```

`usePetsData` is built on Nuxt's `useFetch` like `usePets` was, so `key`, `lazy`, `server`, `transform`, `pick`, `default`, `watch` and `getCachedData` carry over. `$pets` is a plain fetch: in a component's setup, wrap it in `useAsyncData`, or the browser sends the request again while the page hydrates.

## Adjust the Request Options

`path`, `query`, `body`, `method` and `headers` work as before. Three options have no counterpart:

- `header` – Use `headers`.
- `accept` – Set the `Accept` header in `headers`.
- `bodySerializer` – Serialize the body yourself and pass the result as `body`.

## Move the Hooks

nuxt-open-fetch calls a hook for each `ofetch` callback, globally and per client. Nuxt API Party has two [hooks](/guides/hooks), each receiving the endpoint ID:

| nuxt-open-fetch                   | Nuxt API Party                                                             |
| --------------------------------- | -------------------------------------------------------------------------- |
| `openFetch:onRequest`             | `api-party:request`                                                        |
| `openFetch:onResponse`            | `api-party:response`                                                       |
| `openFetch:onResponseError`       | `api-party:response`, which fires for error responses too – check `ctx.response.ok` |
| `openFetch:onRequestError`        | No hook – pass an `onRequestError` [interceptor](/guides/interceptors) to the call |
| `openFetch:onRequest:pets`        | `api-party:request`, checking `endpointId === 'pets'`                      |

::: code-group
```ts [Before]
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('openFetch:onRequest:pets', (ctx) => {
    ctx.options.headers.set('X-Request-Id', crypto.randomUUID())
  })
})
```

```ts [After]
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('api-party:request', (ctx, endpointId) => {
    if (endpointId !== 'pets')
      return
    ctx.options.headers.set('X-Request-Id', crypto.randomUUID())
  })
})
```
:::

In Nitro, the hooks receive the h3 event before the endpoint ID: `(ctx, event, endpointId)`. They fire for each request the server proxy forwards and for each server import, which passes `event` as `undefined`.

A request from the browser now reaches the API through the server proxy, which withholds an `Authorization` header set in a Nuxt hook unless the endpoint sets [`forwardCredentials`](/guides/credential-forwarding). Attach a server-side credential in a Nitro hook instead.

## Replace the Type Helpers

nuxt-open-fetch keys its helpers by operation ID. Nuxt API Party keys one type per endpoint by path and method, imported from `#nuxt-api-party`:

| nuxt-open-fetch                        | Nuxt API Party                                       |
| -------------------------------------- | ---------------------------------------------------- |
| `PetsResponse<'getPetById'>`           | `Pets<'/pet/{petId}', 'get'>['response']`            |
| `PetsResponse<'getPetById', 404>`      | `Pets<'/pet/{petId}', 'get'>['responses'][404]`      |
| `PetsRequestBody<'addPet'>`            | `Pets<'/pet', 'post'>['request']`                    |
| `PetsRequestQuery<'findPetsByStatus'>` | `Pets<'/pet/findByStatus', 'get'>['query']`          |
| `PetsRequestPath<'getPetById'>`        | `Pets<'/pet/{petId}', 'get'>['path']`                |

```ts
import type { Pets } from '#nuxt-api-party' // [!code ++]
import type { PetsResponse } from '#open-fetch' // [!code --]

type Pet = PetsResponse<'getPetById'> // [!code --]
type Pet = Pets<'/pet/{petId}', 'get'>['response'] // [!code ++]
```

The generated document types move from `#open-fetch-schemas/pets` to `#nuxt-api-party/pets`, which exports `paths` and `components`. There is no `operations` interface – operations are inlined into `paths`. A schema object is `components['schemas']['Pet']` as before, or `PetsModel<'Pet'>`. See [OpenAPI Type Helpers](/api/openapi-types) for every helper.

A failed request's error carries the API's body at `error.data`, as it did. `useMyApiData` types `error` as a `NuxtError` of the operation's error body rather than a `FetchError` – see [Error Handling](/guides/error-handling).
