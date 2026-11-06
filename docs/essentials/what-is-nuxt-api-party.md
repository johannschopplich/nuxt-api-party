# What is Nuxt API Party?

Nuxt API Party is a [Nuxt](https://nuxt.com) module for talking to APIs you don't control. You configure an endpoint once, and the module generates a pair of type-safe composables for it that behave like Nuxt's own `useFetch` and `$fetch` – while the credentials stay on the server and CORS never comes up, because requests travel through a server proxy in your app, unless an endpoint is a client endpoint.

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

**One server proxy in front of your APIs.** Tokens and keys live in the endpoint configuration and never reach the browser – not through the network tab, not through the bundle – and because the browser only ever talks to your own origin, CORS never applies. A [client endpoint](/api/module-configuration#client-endpoints) skips the proxy and publishes its credentials to the browser instead.

**Nuxt's own patterns.** `useMyApiData` is built on Nuxt's `useFetch`, with the same return values and options, and `$myApi` is a plain `$fetch` – for any API.

**As many APIs as you need.** Each endpoint carries its own URL, headers and authentication, and gets its own pair of composables.

**Types from your OpenAPI document.** Point an endpoint at its schema and request bodies, query parameters, path parameters and responses are all inferred. See [OpenAPI Integration](/guides/openapi-integration).

**Caching and hydration.** Server-rendered data hydrates on the client instead of being fetched again, Nuxt's `getCachedData` serves repeated requests from the payload, and GET requests through the proxy use the browser's HTTP cache. See [Caching Strategies](/guides/caching-strategies).

## Next Steps

- [Getting Started](/essentials/getting-started) – Install the module and make a first request.
- [Data Fetching Methods](/essentials/data-fetching-methods) – Choose between the two generated composables.
- [Module Configuration](/api/module-configuration) – Every option an endpoint accepts.
- [How It Works](/advanced/how-it-works) – What the server proxy does with a request.
