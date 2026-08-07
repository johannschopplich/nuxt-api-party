# Migration

## v4.0.0

### Nuxt 4 Is Required

The module no longer supports Nuxt 3.

### `openapi-typescript` v7 Is Required

The peer dependency used to accept `^5 || ^6 || ^7` and now accepts `^7` alone. Upgrade the package alongside the module and regenerate your schema types.

### The `experimental` Namespace Is Gone

Its four flags moved out and two of them changed their default:

| Before                                       | Now                                | Default  |
| -------------------------------------------- | ---------------------------------- | -------- |
| `experimental.enablePrefixedProxy: true`      | `server.proxyMode: 'passthrough'`     | Unchanged |
| `experimental.disableClientPayloadCache: true`| `payloadCache: false`              | Unchanged |
| `experimental.enableAutoKeyInjection: true`   | Removed                            | Always on |
| `experimental.enableSchemaFileWatcher`        | Removed                            | Always on in dev |

Every `useMyApiData` call now gets its own async data state, keyed by its position in your source, the way Nuxt keys `useFetch` and `useAsyncData` – with no switch either way, as Nuxt has none. Two components asking for the same resource therefore no longer share a `data` ref, and no longer collide when their `transform`, `pick` or `default` options differ. They do still share the underlying request. Pass the same explicit `key` to put two call sites back on one instance.

The schema file watcher no longer has a switch. Nuxt's own builder watcher cannot stand in for it – it covers each layer's `app` and `server` directories only, and a path registered through `nuxt.options.watch` restarts the dev server rather than regenerating the types.

### `refresh()` Sends the Request Again

The request cache sits below Nuxt's async data, so Nuxt could not reach into it: `refresh()`, `clear()` and a key change driven by a reactive option were answered with the response already cached for that request. Each of them now sends a new request. Expect more traffic where a page refreshes on an interval, and reach for `getCachedData` to decide when a call site may keep what it has.

### `cache` Only Means the Browser Cache Now

`cache` used to accept a boolean alongside the [`RequestInit.cache`](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache) values, and the boolean drove the payload cache. Payload caching now has its own option:

```ts
const { data } = await useMyApiData('posts', {
  cache: false, // [!code --]
  payloadCache: false // [!code ++]
})
```

`cache: true` and `cache: false` are compile errors, so they surface on upgrade. One change is silent, though: a string value used to turn payload caching off as a side effect. `cache: 'no-store'` now only sets the browser cache mode, and the payload cache stays on unless you add `payloadCache: false`.

### A `FormData` Body Travels as an Ordered Entry List

The wrapped proxy used to serialize a `FormData` body into an object keyed by field name, so repeated names collapsed into one array and lost their place among the other fields – and a field named `__type` overwrote the marker that identifies the payload. It now sends the entries in the order the form holds them, which is the order your API receives them in. `SerializedFormData` carries that list as `entries`, and a serialized blob carries its `name` in place of its `size`.

This only concerns you if you read the proxy payload yourself, in a [request hook](/guides/hooks) or a custom handler.

### The Wrapped Proxy Reports `502` for an Unreachable API

An API that cannot be reached used to yield `503 Service Unavailable` from the default proxy and `502 Bad Gateway` from the passthrough one. Both report `502` now.

### The Passthrough Proxy No Longer Forwards `authorization`

With [`server.proxyMode`](/api/module-configuration#proxymode) set to `'passthrough'`, a browser request's `authorization` header used to travel on to your API. It no longer does: the header carries the caller's credentials for *your* app, not your app's credentials for the upstream service.

A cookie still travels, but only for endpoints that set `cookies: true`. Note that the passthrough proxy forwards the request as it stands and does not add the endpoint's `token`, `headers` or `query` – only the default `/api/__api_party/{endpointId}` handler does. If you relied on the old behavior to pass a bearer token through, attach it in a [request hook](/guides/hooks).

### Endpoint Types Resolve Through the Client

`Service<Path, Method>` used to compute `request`, `response` and `responses` with its own type logic, which disagreed with what the composables returned. Both now resolve through the same helpers, so the type you extract is the type you get back.

Three consequences, all at type level:

- A method the path doesn't declare is now a compile error. `PetStore<'/pet', 'get'>` fails where the schema declares only `post` and `put`; likewise `PetStoreApiMethods<'/pet'>` narrows from every HTTP verb to `'post' | 'put'`.
- An operation that declares no path or query parameters reports `never`, where the old logic answered `undefined`, and one that declares no request body reports `undefined`, where the old logic answered `unknown`.
- A status code that carries no response body reports `undefined` in `responses`, in place of `Record<string, never>`. So does `response` for an operation whose success carries no body – `PetStore<'/pet/{petId}', 'delete'>['response']` is now `never`.

See [OpenAPI Type Helpers](/api/openapi-types) for what each property now reports.

### `schema` No Longer Accepts a Function

An endpoint's `schema` takes a file path, a URL or the parsed schema object. Resolve a schema you have to build yourself in the [`api-party:extend` hook](/guides/hooks) instead, which runs at module initialization and can await:

```ts
export default defineNuxtConfig({
  hooks: {
    'api-party:extend': async (options) => {
      options.endpoints!.myApi!.schema = await buildSchema()
    },
  },
})
```

Passing a function was deprecated in v2.1.0 and now throws.

### Removed Deprecated Type Helpers

`Response`, `RequestBody` and `RequestQuery` are gone from `#nuxt-api-party/{endpointId}`. They were keyed by operation ID; the endpoint interface is keyed by path and method, which is what the composables take:

```ts
import type { PetStore } from '#nuxt-api-party' // [!code ++]
import type { Response } from '#nuxt-api-party/petStore' // [!code --]

type Pet = Response<'getPetById'> // [!code --]
type Pet = PetStore<'/pet/{petId}', 'get'>['response'] // [!code ++]
```

`RequestBody<'addPet'>` becomes `PetStore<'/pet', 'post'>['request']`, and `RequestQuery<'findPetsByStatus'>` becomes `PetStore<'/pet/findByStatus', 'get'>['query']`.

## v3.0.0

Caching has been completely refactored in Nuxt API Party v3. If you are using caching, please read the [caching documentation](/guides/caching-strategies) to understand the new caching system.

::: warning
Caching behavior is now controlled by the upstream endpoint. If your endpoint does not support caching, the responses will not be stored in the browser's cache. This is a breaking change from previous versions, where caching was done regardless.

The simplest way to ensure caching is enabled on the backend is to set the `Cache-Control: max-age=3600` header on your API responses, which will cache the response for 1 hour.

See the MDN documentation on [HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching) for more information on how to set up caching on your API.
:::

- Cached responses are no longer stored in the Nuxt payload data. Instead, they are stored in the browser's cache, which allows for better memory management and performance. This follows a change done in Nuxt 3.17.
- Generated `$myApi` and `useMyApiData` composables now support the `RequestInit.cache` option. For convenience, you can pass `true` for `'default'` caching, or `false` for `'no-store'` caching.
- `$myApi` composables now have caching enabled by default. To restore the old behavior, you can set the `cache` option to `false` or `'no-store'` in the request options.

  ```ts
  const data = $petStore('/user/{username}', {
    cache: 'no-store', // [!code ++]
  })
  ```

## v2.0.0

::: tip
Breaking changes are limited to using typed OpenAPI clients. If you don't require typed clients in your Nuxt application, you can skip this migration section.
:::

With Nuxt API Party v2, the OpenAPI support has been refactored to conform to the upcoming version of the `openapi-types` package (v7). This change introduces a few breaking changes to the API Party OpenAPI client:

- Dropped support for OpenAPI 2.0 (Swagger).
- Previously, you could omit the leading slash in the API path. This is no longer possible. You must now include the leading slash in the path, just like in the OpenAPI specification.
- The `pathParams` fetch option has been renamed to `path` to better align with the OpenAPI specification and allow for more flexibility in the future.

```ts
const { data } = await usePetStoreData(
  'user/{username}', // [!code --]
  '/user/{username}', // [!code ++]
  {
    pathParams: { username: 'user1' }, // [!code --]
    path: { username: 'user1' }, // [!code ++]
  }
)
```

## v1.0.0

Following the release of Nuxt [3.9](https://github.com/nuxt/nuxt/releases/tag/v3.9.0), type possibilities for errors returned by `useAsyncData` and `useFetch` have been significantly improved to make them more accurate in terms of what they actually contain. See the [refactor PR](https://github.com/nuxt/nuxt/pull/24396) for more information.

This change also affects the error handling for API Party composables. The error types have been updated to reflect the changes in Nuxt 3.9. As such, you may need to update your code to make use of the new type possibilities:

```ts
import type { NuxtError } from '#app'

// The error is now typed as `NuxtError<unknown> | null`
const { data, error } = await useMyApiData('posts')

// For dollar API calls, the error has to be typed as `NuxtError`
try {
  await $myApi('posts')
}
catch (error) {
  console.error(error as NuxtError)
}
```
