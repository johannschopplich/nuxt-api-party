# Caching

You can cache your API responses to improve performance between multiple calls like for page navigation.

::: info
Responses from `useMyApiData` are cached by default. On the other hand, you have to enable caching for `$myApi` manually.
:::

## Caching Strategy

Both [generated composables](/api/#dynamic-composables) will calculate a cache key based on the following properties:

- API endpoint ID
- Path
- Query
- HTTP method
- Body

If the cache key is already present in the cache, the cached response will be returned instead of making a new API call.

::: tip
The cache key is reactive when using `useMyApiData`. This means that the cache key will be recalculated when any of the properties change.
:::

## Cache Options

You can disable the cache for each request by setting the `cache` option to `false`. This is necessary for the `useMyApiData` composable:

```ts
// Disable caching for a single request
const { data } = await useJsonPlaceholderData('posts/1', {
  cache: false
})
```

::: info
These examples assume that you have set up an API endpoint called `jsonPlaceholder`:

```ts
// `nuxt.config.ts`
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    endpoints: {
      jsonPlaceholder: {
        url: 'https://jsonplaceholder.typicode.com'
      }
    }
  }
})
```

:::

Although the `$myApi` composables are intended for one-time API calls, like submitting form data, you can also cache their responses when needed:

```ts
// Enable cache for a single request
const response = $jsonPlaceholder('posts/1', {
  method: 'POST',
  body: {
    foo: 'bar'
  },
  cache: true
})
```
