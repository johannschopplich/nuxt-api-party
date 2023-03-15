# Hydration

API calls executed on the server (SSR) are hydrated on the client to avoid unnecessary API calls. Thus, a request initiated on the server will not be executed again on the client.

## Nuxt Static Generation

When using `nuxi generate` to pre-render your application, the result of each API call is stored in the [Nuxt `payload`](https://nuxt.com/docs/api/composables/use-nuxt-app#payload).
