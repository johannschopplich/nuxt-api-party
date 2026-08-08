# Server Imports

Every endpoint generates a `$myApi` for Nitro alongside the two composables. It is auto-imported everywhere your server code runs – API routes, middleware, server plugins, tasks – and calls your API directly:

```ts
// `server/api/posts.get.ts`
export default defineEventHandler(async () => {
  return await $jsonPlaceholder('posts')
})
```

Import it explicitly from `#nuxt-api-party/server` where auto-imports do not reach.

The endpoint's `url`, `token`, `query` and `headers` come from the private runtime config and are attached the same way the proxy attaches them. Path parameters, `query`, `headers`, `body` and `method` work as they do in the browser.

::: info Placeholder
`$myApi` is a placeholder. The name is generated from your API endpoint ID, so endpoint `jsonPlaceholder` generates `$jsonPlaceholder` – the same name the browser-side composable carries.
:::

## What It Leaves Out

Server code needs neither the proxy nor the browser's caches, so this is a plain `$fetch` against your API and nothing more:

- **No proxy.** The request goes straight to your API rather than through `/api/__api_party/{endpointId}`, which saves the hop that only exists to keep credentials off the client.
- **No payload cache.** Two calls for the same resource are two requests. Reach for Nitro's [`cachedEventHandler`](https://nitro.build/guide/cache) where you want caching.
- **No hooks.** `api-party:request` and `api-party:response` are Nuxt app hooks and do not fire here.
- **No `client` option.** There is no browser to send from.

The generated type carries only what a server call acts on, so `client`, `payloadCache`, `key` and `$fetch` are type errors here rather than silent no-ops.
