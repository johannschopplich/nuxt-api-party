# What is Nuxt API Party?

Nuxt API Party is a [Nuxt](https://nuxt.com) module for talking to APIs you don't control. You configure an endpoint once, and the module generates a pair of type-safe composables for it that behave like Nuxt's own `useFetch` and `$fetch` – while the credentials stay on the server and CORS never comes up, because every request travels through a Nuxt server route.

## Generated Composables

Each endpoint you configure yields two composables, named after its endpoint ID.

A `useFetch`-like composable, for reactive data in components and pages:

```ts
// Endpoint `jsonPlaceholder` generates `useJsonPlaceholderData`
const { data, refresh, error, status } = await useJsonPlaceholderData('posts/1')
```

And a `$fetch`-like composable, for programmatic calls, form submissions and one-off actions:

```ts
// Endpoint `jsonPlaceholder` generates `$jsonPlaceholder`
const post = await $jsonPlaceholder('posts', {
  method: 'POST',
  body: { title: 'New Post', body: 'Hello World', userId: 1 }
})
```

[Data Fetching Methods](/essentials/data-fetching-methods) covers which to reach for.

## What You Get

**Credentials stay on the server.** Tokens and keys live in the endpoint configuration and never reach the browser – not through the network tab, not through the bundle.

**No CORS.** Requests go server-to-server, then server-to-client, so the browser never makes a cross-origin request in the first place.

**Nuxt's own patterns.** Same return values, same options, same caching behavior as `useFetch` and `$fetch` – for any API.

**As many APIs as you need.** Each endpoint carries its own headers, authentication and caching, and gets its own pair of composables.

**Types from your OpenAPI schema.** Point an endpoint at a schema and request bodies, query parameters, path parameters and responses are all inferred. See [OpenAPI Integration](/guides/openapi-integration).

**Caching and hydration.** Payload caching keeps duplicate requests from going out, and server-rendered data hydrates on the client instead of being fetched again. See [Caching Strategies](/guides/caching-strategies).

## Next Steps

- [Getting Started](/essentials/getting-started) – Install the module and make a first request.
- [Data Fetching Methods](/essentials/data-fetching-methods) – Choose between the two generated composables.
- [Module Configuration](/api/module-configuration) – Every option an endpoint accepts.
- [How It Works](/advanced/how-it-works) – What the proxy route does with a request.
