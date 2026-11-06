# Hooks

Hooks run inside your app – in a Nuxt plugin or a Nitro plugin – and see every request the module sends, whichever endpoint it belongs to. Each runtime hook receives the endpoint ID, so one handler covers all endpoints and branches where they differ. Use hooks for behavior that spans endpoints, such as attaching a per-visitor token on the server, setting a timeout, or logging failures centrally.

To change a single call instead, reach for an [interceptor](/guides/interceptors).

For more information on how to work with hooks, see the [Nuxt documentation](https://nuxt.com/docs/guide/going-further/hooks).

## Available Hooks

| Hook Name            | Runs In | Arguments                    | Description                                                                                              |
| -------------------- | ------- | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| `api-party:extend`   | Build   | `options`                    | Called at module initialization, before the module reads the endpoints. Allows modifying them.          |
| `api-party:request`  | Nuxt    | `ctx, endpointId`            | Called before each request a composable sends, in the browser and during SSR.                           |
| `api-party:response` | Nuxt    | `ctx, endpointId`            | Called after each response a composable receives, error responses included.                            |
| `api-party:request`  | Nitro   | `ctx, event, endpointId`     | Called before each request the server proxy or a [server import](/api/server-imports) sends to the API. |
| `api-party:response` | Nitro   | `ctx, event, endpointId`     | Called after each response the server proxy or a server import receives from the API.                   |

`ctx` is the [`ofetch`](https://github.com/unjs/ofetch) context of the request, the same object an interceptor receives: `ctx.request`, `ctx.options` and, in a response hook, `ctx.response`.

## Module Hook

`api-party:extend` runs once, at module initialization, and may await. Use it to modify the endpoint configuration before the module is fully initialized. For example, log the configured endpoints:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  hooks: {
    'api-party:extend': async (options) => {
      console.log(`Configured endpoints:`, options.endpoints)
    },
  },
})
```

## Nuxt Runtime Hooks

Register Nuxt runtime hooks in a Nuxt plugin. They fire for every `$myApi` and `useMyApiData` call: in the browser, and on the server during SSR.

`ctx.options` is the place for defaults that span endpoints – headers, `retry`, `retryDelay` and `timeout` all take effect when set here:

```ts [plugins/api-party.ts]
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('api-party:request', (ctx, endpointId) => {
    // Add a unique request ID to each request
    ctx.options.headers.set('X-Request-Id', crypto.randomUUID())

    if (endpointId === 'jsonPlaceholder') {
      ctx.options.retry = 3
      ctx.options.timeout = 5000
    }
  })
})
```

::: warning Client-Side Execution
Nuxt hooks run in the browser as well, and a request from the browser reaches the [server proxy](/advanced/how-it-works) like any visitor's. Without [credential forwarding](/guides/credential-forwarding), an `Authorization` header set here never reaches the API. Attach credentials in a Nitro hook instead.
:::

## Nitro Runtime Hooks

Register Nitro runtime hooks in a server plugin. They fire for every request the [server proxy](/advanced/how-it-works) forwards and for every [server import](/api/server-imports) call, and are the place for credentials that depend on the visitor:

```ts [server/plugins/api-party.ts]
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('api-party:request', async (ctx, event, endpointId) => {
    if (endpointId !== 'myApi' || !event)
      return

    // Fetch a token for the visitor and attach it to the request
    const token = await getUserToken(event)
    ctx.options.headers.set('Authorization', `Bearer ${token}`)
  })
})
```

`event` is the h3 event of the request the proxy is answering. A server import has no request to answer, so `event` is `undefined` there – which also tells the two apart.

A request hook that throws an h3 error, such as `throw createError({ statusCode: 401 })`, answers the proxy request with that error and the API is never called.

::: info Response Body in the Proxy
The server proxy streams the API's response through, so in a Nitro response hook for a proxy request, `ctx.response._data` is a `ReadableStream`, not the parsed body. Read status and headers from `ctx.response`, and set additional response headers on `event`. The proxy copies the API's headers after the hook, so to replace one of them, answer the request in the hook and end the response – the [rewrite redirects example](https://github.com/johannschopplich/nuxt-api-party/tree/main/examples/rewrite-redirects) does this. A server import parses the body as usual.
:::
