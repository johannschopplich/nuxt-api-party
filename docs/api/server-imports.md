# Server Imports

Every endpoint generates a `$myApi` for Nitro alongside the two composables. It is auto-imported everywhere your server code runs – API routes, middleware, server plugins, tasks – and calls the API directly:

```ts
// `server/api/posts.get.ts`
export default defineEventHandler(async () => {
  return await $jsonPlaceholder('posts')
})
```

Import it explicitly from `#nuxt-api-party/server` where auto-imports do not reach.

The endpoint's `url`, `token`, `query` and `headers` come from the private runtime config and are added to every call. A header the call sets replaces the endpoint's header of the same name, so an `Authorization` header in the call's `headers` takes the place of the token. Path parameters, `query`, `headers`, `body`, `method` and the other [`ofetch` options](https://github.com/unjs/ofetch) work as they do in the browser, except `baseURL`, which the endpoint decides, and `redirect`, which is always `manual` – see [Redirects](#redirects).

::: info Placeholder
`$myApi` is a placeholder. The name is generated from the endpoint ID, so endpoint `jsonPlaceholder` generates `$jsonPlaceholder` – the same name the browser-side composable carries.
:::

## Hooks

A server import fires the Nitro [`api-party:request` and `api-party:response` hooks](/guides/hooks#nitro-runtime-hooks), with `event` set to `undefined` – there is no proxy request it answers. The Nuxt app hooks do not fire here.

## Redirects

A server import doesn't follow redirects: a `3xx` response resolves instead of throwing, with whatever body the redirect carries. Read its status and `Location` header in an `onResponse` interceptor, and send a follow-up request yourself where the target is trusted.

## What It Leaves Out

Server code needs neither the proxy nor the browser's caches, so this is a `$fetch` against the API and nothing more:

- **No proxy.** The request goes straight to the API rather than through the server proxy, which saves the hop that only exists to keep credentials off the browser. [Allowed routes](/guides/allowed-routes) don't apply.
- **No visitor credentials.** The visitor's cookie and `Authorization` header stay behind, whatever `forwardCredentials` says. Pass them in `headers` where the API needs them.
- **No payload cache.** Two calls for the same resource are two requests. Reach for Nitro's [`cachedEventHandler`](https://nitro.build/guide/cache) where you want caching.
