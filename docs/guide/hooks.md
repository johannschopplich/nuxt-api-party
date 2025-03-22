# Hooks

Nuxt API Party provides a set of powerful hooks that allow you to customize the behavior of the module at various stages. The hook system supports both Nuxt and Nitro environments with fully typed, merged hooks that ensure both generic and endpoint-specific handlers are executed in the correct order.

For more information on how to work with hooks, see the [Nuxt documentation](https://nuxt.com/docs/guide/going-further/hooks).

## Available Hooks

| Hook Name                          | Arguments           | Description                                                                                              |
| ---------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------- |
| `api-party:extend`                 | `options`           | Called during module initialization after options are resolved. Allows modifying endpoint configuration. |
| `api-party:request`                | `ctx, [event]`      | Called before each API request. This generic hook runs on both Nuxt and Nitro platforms. |
| `api-party:request:${endpointId}`  | `ctx, [event]`      | Called specifically for the designated endpoint. Merged with the generic request hook. |
| `api-party:response`               | `ctx, [event]`      | Called after each API response. This generic hook is used to handle response modifications on both platforms. |
| `api-party:response:${endpointId}` | `ctx, [event]`      | Called for the specific endpoint response. Merged with the generic response hook. |

::: info Merging Hooks
Both generic and endpoint-specific hooks are merged so that:

- For requests: The generic `api-party:request` hook executes first, followed by `api-party:request:${endpointId}`.
- For responses: The endpoint-specific `api-party:response:${endpointId}` hook executes first, followed by `api-party:response`.
:::

## Nuxt Runtime Hooks

Register Nuxt runtime hooks either in your `nuxt.config.ts` file, in a client plugin or at runtime. These hooks are useful for extending [API endpoints](/config/#apiparty-endpoints) with additional configuration or for intercepting API calls for tasks like logging, metrics, or dynamically adding headers.

The only hook called at module initialization is `api-party:extend`. This hook is useful for modifying endpoint configuration before the module is fully initialized. For example, you can log the resolved server endpoints:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  hooks: {
    'api-party:extend': async (options) => {
      console.log(`Resolved server endpoints:`, options.endpoints)
    },
  },
})
```

All other hooks are called at runtime, either on the client side (or the server side on SSR requests). For example, you can add headers to all requests using the `api-party:request` hook:

```ts [plugins/my-plugin.ts]
export default defineNuxtPlugin((nuxtApp) => {
  // Generic hook: executes on every API request
  nuxtApp.hook('api-party:request', (ctx) => {
    // Add a unique request ID to each request
    ctx.options.headers.set('X-Request-Id', Math.random().toString(36).substring(7))
  })
})
```

::: warning
All of the Nuxt hooks are executed on the client side by default. Do not use them for sensitive operations like authentication or authorization. Instead, use Nitro hooks for server-side processing.
:::

## Nitro Runtime Hooks

For server-side processing, register these hooks in a server plugin. They are geared for tasks like dynamically fetching tokens or logging responses.

The most common use case for Nitro hooks is to attach a token to a request before it is sent. For example, you can attach a user token to a specific endpoint request:

```ts [server/plugins/my-plugin.ts]
export default defineNitroPlugin((nitroApp) => {
  // Generic request hook: runs before any API request on the server
  nitroApp.hook('api-party:request', async (ctx, event) => {
    // Do something before each request
  })

  // Endpoint-specific request hook for `myapi`
  nitroApp.hook('api-party:request:myapi', async (ctx, event) => {
    // Fetch a user token and attach it to the request
    const token = await getUserToken(event)
    ctx.options.headers.set('Authorization', `Bearer ${token}`)
  })

  // Example of a response hook to modify or log responses
  nitroApp.hook('api-party:response:myapi', async (ctx, event) => {
    // Custom response handling
  })
})
```
