# Hooks

Nuxt API Party provides a number of hooks that can be used to customize the module's behavior. Hooks are functions that are called at specific points in the module's lifecycle. You can use hooks to modify the module's configuration.

For more information on how to work with hooks, see the [Nuxt documentation](https://nuxt.com/docs/guide/going-further/hooks).

## Available Hooks

| Hook Name  | Arguments | Description |
| ---------- | --------- | ----------- |
| `api-party:extend` | `options` | Called during module initialization after the options have been resolved. Can be used to modify the endpoint configuration. |

### Usage

To use hooks, define them in the `hooks` property of your `nuxt.config.ts` file. The following example demonstrates how to use the `api-party:extend` hook:

```ts
// `nuxt.config.ts`
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

| Hook name            | Arguments  | Description
| -------------------- | ---------- | -----------
| `api-party:request`  | `ctx`      | Called before each request is made. Can be used to log or modify the request.
| `api-party:response` | `ctx`      | Called after each request is made. Can be used to log or modify the response.

## Nitro Runtime Hooks

Register these hooks with a server plugin.

| Hook name            | Arguments    | Description
| -------------------- | ------------ | -----------
| `api-party:request`  | `ctx, event` | Called before each request is made. Can be used to log or modify the request.
| `api-party:response` | `ctx, event` | Called after each request is made. Can be used to log or modify the response.
