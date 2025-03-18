# Hooks

Nuxt API Party provides a number of hooks that can be used to customize the module's behavior. Hooks are functions that are called at specific points in the module's lifecycle. You can use hooks to modify the module's configuration.

For more information on how to work with hooks, see the [Nuxt documentation](https://nuxt.com/docs/guide/going-further/hooks).

## Available Hooks

| Hook Name  | Arguments | Description |
| ---------- | --------- | ----------- |
| `api-party:extend` | `options` | Called during module initialization after the options have been resolved. Can be used to modify the endpoint configuration. |

### Usage

To use hooks, define them in the `hooks` property of your `nuxt.config.ts` file. The following example demonstrates how to use the `api-party:extend` hook:

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

## Nuxt Runtime Hooks

Register these hooks with a client plugin.

| Hook name                        | Arguments  | Description
| -------------------------------- | ---------- | -----------
| `api-party:request`              | `ctx`      | Called before each request is made. Can be used to log or modify the request.
| `api-party:request:${endpoint}`  | `ctx`      | Like `api-party:request`, but for `${endpoint}`.
| `api-party:response`             | `ctx`      | Called after each request is made. Can be used to log or modify the response.
| `api-party:response:${endpoint}` | `ctx`      | Like `api-party:response` but for `${endpoint}`.

### Usage

To use runtime hooks, define them in a client plugin. The following example demonstrates how to use the `api-party:request` hook.

```ts
// plugins/myplugin.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('api-party:request:myapi', (ctx) => {
    // Add a unique request ID to each request
    ctx.request.headers['X-Request-Id'] = Math.random().toString(36).substring(7)
  })
})
```

## Nitro Runtime Hooks

Register these hooks with a server plugin.

| Hook name                        | Arguments    | Description
| -------------------------------- | ------------ | -----------
| `api-party:request`              | `ctx, event` | Called before each request is made. Can be used to log or modify the request.
| `api-party:request:${endpoint}`  | `ctx, event` | Like `api-party:request`, but for `${endpoint}`.
| `api-party:response`             | `ctx, event` | Called after each request is made. Can be used to log or modify the response.
| `api-party:response:${endpoint}` | `ctx, event` | Like `api-party:response` but for `${endpoint}`.

### Usage

To use Nitro runtime hooks, define them in a server plugin. The following example demonstrates how to use the `api-party:request` hook.

```ts
// server/plugins/myplugin.ts
export default defineNitroPlugin((nitroApp) => {
  nuxtApp.hook('api-party:request:myapi', async (ctx, event) => {
    // Fetch a token from a database and attach to the request
    const token = await useSavedToken(event)
    ctx.request.headers.Authorization = `Bearer ${token}`
  })
})
```
