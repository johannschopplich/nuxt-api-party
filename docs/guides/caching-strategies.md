# Caching Strategies

Effective caching is crucial for building performant applications that minimize network requests while keeping data fresh. Nuxt API Party provides two complementary caching mechanisms: **in-memory caching** for rapid data access and **browser HTTP caching** for persistent storage across sessions.

Understanding these caching strategies helps you optimize your application's performance while ensuring users see up-to-date information when needed.

## In-Memory Caching

In-Memory caching is the default caching behavior for data composables. It uses a custom caching mechanism that stores the response in memory and updates it with the latest response from the server.

Benefits of in-memory caching over browser caching include:

- Support for caching non-GET requests.
- Does not require the server to respond with `Cache-Control`, `ETag`, or `Last-Modified` headers.

Downsides of legacy caching include:

- Cache does not persist across page reloads.
- Cache is not shared across tabs or windows.
- Refreshing data requires a call to `clear` then `refresh` functions.

## Built-in Browser Caching

To enable persistent caching across page reloads, you can leverage the browser's [built-in caching mechanism](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching) if your endpoint supports it.

If your endpoint supports client caching, the response will be cached by the browser. Subsequent GET requests to the same endpoint will return the cached response, if available, without making a new request to the server.

The cached response will be used until it expires.

To enable built-in browser caching in your data composable, set the `cache` option to one of the values in the [options](#cache-options) section below.

::: tip HTTP Caching
To support HTTP caching, you must enable the [`enablePrefixedProxy`](/essentials/module-configuration#enableprefixedproxy) experimental option in your `nuxt.config` file. This allows GET requests to be GET requests, which is required for caching to work correctly.

```ts
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],
  apiParty: {
    experimental: {
      enablePrefixedProxy: true
    }
  }
})
```
:::

### Endpoint Requirements

To support HTTP client caching, your endpoint must meet the following requirements:

- Support GET requests.
- Respond with a cache supporting headers, such as `Cache-Control`, `ETag`, or `Last-Modified`.

## Cache Options

Caching is enabled by default for all requests. You can control the caching behavior by setting the `cache` option in the request options. The `cache` option accepts the same values as [`Request.cache`](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache).

The available options are:

- `'default'`: Checks the cache. If it is missing or stale, executes the request and stores the cached response.
- `'no-store'`: Always fetch from the server, doesn't update the cache.
- `'reload'`: Reload the resource from the server and update the cache.
- `'no-cache'`: Use the cache, but revalidate with the server before returning the cached response.
- `'force-cache'`: Use the cache, even if it is stale.
- `'only-if-cached'`: Use the cache, but do not make a request to the server if the resource is not in the cache. If the resource is not in the cache, will respond with a 504 Gateway Timeout error.
- `true`: Enables default caching behavior. See the [Default Caching Behavior](#default-caching-behavior) section for more details.
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

::: info Demo Setup
These examples assume that you have set up an API endpoint called `jsonPlaceholder`:

::: code-group
```ts [nuxt.config.ts]
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

:::

### In-Memory Caching

Omitting or passing `true` to the `cache` option enables in-memory caching behavior.

```ts
// In-Memory caching behavior
const { data } = await useJsonPlaceholderData('posts', {
  // The default value is `true`
  cache: true // [!code ++]
})
```

### Refresh Cached Data

When using in-memory caching, to refresh cached data, you need to call the `clear` function to invalidate the cache, then call the `refresh` function to fetch fresh data from the server.

```ts
// Refresh cached data
const { data, clear, refresh } = await useJsonPlaceholderData('posts')

async function invalidateAndRefresh() {
  // Must clear the cache before calling refresh, otherwise it will reuse the cached data
  clear()
  await refresh()
}
```

### Built-in Browser Caching

Passing a string value to the `cache` option enables built-in browser caching behavior. This mode only works for GET requests and requires proper cache headers on the endpoint response.

```ts
// Enable browser caching
const { data } = await useJsonPlaceholderData('posts', {
  cache: 'default' // [!code ++]
})
```

### Disable Caching

Passing `false` or `'no-store'` to the `cache` option disables caching for that request.

```ts
// Disable caching for a single request
const { data } = await useJsonPlaceholderData('posts/1', {
  cache: false // 'no-store' // [!code ++]
})
```

### Refresh Browser Cached Data

For resources that may change frequently, use the `'reload'` option to ensure that the browser checks with the server for a fresh response before returning the cached response.

::: info
This mode will make a conditional request to the server, and if the resource has not changed, it should return a `304 Not Modified` response, allowing the browser to reuse the cached response.

Endpoints should check for the request headers `If-None-Match` or `If-Modified-Since` to determine if the resource has changed.
:::

```ts
const { data, refresh } = await useJsonPlaceholderData('posts', {
  cache: 'reload' // [!code ++]
})

async function invalidateAndRefresh() {
  await refresh()
}
```

### Reload Button

Sometimes a button is used to reload data on demand. In this case, you may want to set the cache option to `'reload'` to ensure that the data is revalidated with the server on refresh. Unfortunately, this makes the first request also use the `'reload'` option, even when there's data in the cache.

There is no builtin way to make the cache use `'default'` for the first request and `'reload'` for manual refreshes, but you can achieve this by using a `ref`. Set it to `'default'` initially, then before you call `refresh()`, set it to `'reload'`.

```vue
<script setup lang="ts">
const cache = ref<RequestCache>('default')
const { data, refresh } = await useJsonPlaceholderData('posts', {
  cache,
  onRequest: () => {
    // After a manual trigger, reset the cache option to 'default'
    // allows subsequent watch-triggered requests to use the cached data
    cache.value = 'default'
  }
})

function onReloadButtonClick() {
  // Change the cache option to 'reload' to force a revalidation with the server
  cache.value = 'reload'
  refresh()
}
</script>

<template>
  <div>
    <button @click="onReloadButtonClick">
      Reload
    </button>
    <div>
      {{ data }}
    </div>
  </div>
</template>
```
