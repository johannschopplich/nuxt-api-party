# Caching

If your endpoint supports [client caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching), the response will be cached by the browser. Subsequent GET requests to the same endpoint will return the cached response, if available, without making a new request to the server.

The cached response will be used until it expires.

::: info
Your upstream server endpoints **MUST** respond with a `Cache-Control` header for caching to be enabled.
:::

## Cache Options

Caching is enabled by default for all requests. You can control the caching behavior by setting the `cache` option in the request options. The `cache` option accepts the same values as [`Request.cache`](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache).

The available options are:

- `'default'`: Checks the cache. If it is missing or stale, executes the request and stores the cached response.
- `'no-store'`: Always fetch from the server, doesn't update the cache.
- `'reload'`: Reload the resource from the server and update the cache.
- `'no-cache'`: Use the cache, but revalidate with the server before returning the cached response.
- `'force-cache'`: Use the cache, even if it is stale.
- `'only-if-cached'`: Use the cache, but do not make a request to the server if the resource is not in the cache. If the resource is not in the cache, will respond with a 504 Gateway Timeout error.
- `true`: Enables legacy caching behavior. See the [Legacy Caching Behavior](#legacy-caching-behavior) section for more details.
- `false`: Equivalent to `'no-store'`

For reference, here is a table summarizing the behavior of each cache option:

| Cache Option      | Loads Cache | Stores Cache | Reuses Stale | Makes Request |
| ------------------|-------------|--------------|--------------|---------------|
| `'default'`       | ✅          | ✅           | ❌           | ✅
| `'no-store'`      | ❌          | ❌           | ❌           | ✅
| `'reload'`        | ❌          | ✅           | ❌           | ✅
| `'no-cache'`      | ✅          | ❌           | ❌           | ✅
| `'force-cache'`   | ✅          | ❌           | ✅           | ✅
| `'only-if-cached'`| ✅          | ❌           | ✅           | ❌

## Examples

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

### Disable Caching

```ts
// Disable caching for a single request
const { data } = await useJsonPlaceholderData('posts/1', {
  cache: 'no-store' // [!code ++]
})
```

### Refresh Cached Data

For resources that may change frequently, use the `'no-cache'` option to ensure that the browser checks with the server for a fresh response before returning the cached response.

```ts
const { data, refresh } = await useJsonPlaceholderData('posts', {
  cache: 'no-cache' // [!code ++]
})

async function invalidateAndRefresh() {
  await refresh()
}
```

### Legacy Caching Behavior

Legacy caching behavior is the default behavior in previous versions of Nuxt API Party. Instead of relying on the browser's cache, it uses a custom caching mechanism that stores the response in memory and updates it with the latest response from the server.

Benefits of legacy caching over browser caching include:

- Support for caching non-GET requests
- Does not require the server to respond with `Cache-Control`, `ETag`, or `Last-Modified` headers.

Downsides of legacy caching include:

- Cache does not persist across page reloads.
- Cache is not shared across tabs or windows.
- Refreshing data requires a call to `clear` then `refresh` functions.

To replicate the legacy caching behavior, you can pass `cache: true` to the request options. This will use the cache if available, and update it with the latest response from the server.

```ts
const { data } = await useJsonPlaceholderData('posts/1', {
  cache: true // [!code ++]
})
```

::: info
Legacy caching behavior may be desired for endpoints that do not support client caching (non-GET requests) and when a server-based public cache is not available.
:::

::: warning
Using `cache: true` is deprecated and may be removed in a future version. It is recommended to use the `fetch` option to provide a custom fetch function that implements the desired caching behavior.
:::

::: warning
`cache: true` is not compatible with custom `fetch` functions. If you need to use a custom fetch function, you must handle caching manually.
:::
