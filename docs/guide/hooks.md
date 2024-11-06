# Hooks

Some hooks are provided via nuxt's hookable system as a convenience. These hooks are called automatically by the module and can be used to extend or modify the module's behavior.

For more information on hooks, see the [nuxt documentation](https://nuxt.com/docs/guide/going-further/hooks).

## Available hooks

| Hook name            | Arguments          | Description
| -------------------- | ------------------ | -----------
| `api-party:resolve`  | `id, endpoint` | Called during module initialization for each configured endpoint. Can be used to modify the endpoint configuration.
