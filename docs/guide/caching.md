# Caching

Apart from [hydration](/guide/hydration), you can also cache your API responses to improve performance between multiple calls like for page navigation.

::: info
Responses from `useApiPartyData` are cached by default. On the other hand, you have to enable caching for `$apiParty` manually.
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
The cache key is reactive when using `useApiPartyData`. This means that the cache key will be recalculated when any of the properties change.
:::

## Cache Options

You can disable the cache for each request by setting the `cache` option to `false`:

```ts
// Disable caching for a single request
const { data } = await useJsonPlaceholderData('posts/1', {
  cache: false
})

// Enable cache for a single request
const response = $jsonPlaceholder('posts/1', {
  method: 'POST',
  body: {
    foo: 'bar'
  },
  cache: true
})
```
