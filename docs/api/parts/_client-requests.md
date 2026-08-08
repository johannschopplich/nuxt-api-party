::: warning
Authorization credentials will be publicly visible. Also, possible CORS issues ahead if the backend is not configured properly.
:::

::: info
If Nuxt SSR is disabled, all requests are made on the client-side by default.
:::

To fetch data directly from your API and skip the Nuxt server proxy, set the `apiParty` module option `client` to `true`:

::: code-group
```ts{8} [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    endpoints: {
      // ...
    },
    client: true
  }
})
```
:::

Now you can make client-side requests by setting the `client` option to `true` in the composable.

::: code-group
```ts{3} [$jsonPlaceholder]
const data = await $jsonPlaceholder(
  'posts',
  { client: true }
)
```

```ts{3} [useJsonPlaceholderData]
const { data } = await useJsonPlaceholderData(
  'posts',
  { client: true }
)
```
:::

::: info
Set the `client` module option to `always` to make all requests on the client-side.
:::
