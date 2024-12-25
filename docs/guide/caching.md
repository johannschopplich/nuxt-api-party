# Caching

You can cache your API responses to improve performance between multiple calls like for page navigation.

In general, if the response is cached, it will be cached indefinitely while your application is running. The cache is only invalidated:

- When the cache is manually cleared with the `clear` function.
- When the cache is automatically invalidated after an error response.
- When the cache key changes, e.g. when the query parameters are updated.

::: info
Responses from the [`useFetch`-like composable](/api/use-fetch-like) are cached by default. On the other hand, you have to enable caching for [`$fetch` composable](/api/dollarfetch-like) manually.
:::

## Caching Strategy

Both [generated composables](/api/#generated-composables) will calculate a cache key (if no custom one is provided) based on the following properties:

- API endpoint ID
- Path
- Path Parameters (if [OpenAPI type generation](/guide/openapi-types) is enabled)
- Query
- HTTP method
- Body

If the cache key is already present in the cache, the cached response will be returned instead of making a new API call.

::: tip
The cache key is reactive when using the [`useFetch`-like composable](/api/use-fetch-like). This means that the cache key will be recalculated when any of the properties change.
:::

## Custom Cache Key

For more control over when the cache should be invalidated, you can provide a custom cache key to de-duplicate requests. Please head to the API references for more information:

- [Customize the cache key](/api/use-fetch-like#caching) for the `useFetch`-like composable.
- [Customize the cache](/api/dollarfetch-like#caching) for the `$fetch`-like composable.

## Cache Options

You can disable the cache for each request by setting the `cache` option to `false`. This is necessary for the `useFetch`-like composable:

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

## Invalidate Cache

You can clear the cache for a specific query by calling the `clear` function. This will remove the cached data for the query and allow the next request to fetch the data from the server.

For example, use the `refresh` function to make a new API call after clearing the cache:

```ts
const { data, refresh, clear } = await useMyApiData('posts')

async function invalidateAndRefresh() {
  clear()
  await refresh()
}
```

## Invalidate Cache On Error

If a request fails, the cache will be invalidated by default. This means that the next request will not return the cached response, but make a new API call instead.
