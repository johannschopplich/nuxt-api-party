# Caching Strategies

Nuxt API Party caches in two places: in the Nuxt payload, which is fast and lives for the page, and in the browser's HTTP cache, which survives reloads. They are independent and each has its own option – `payloadCache` for the former, `cache` for the latter.

## In-Memory Caching

Payload caching is the default for data composables. A response is stored in the Nuxt payload under a key derived from the request, so a repeated request for the same resource resolves without a round trip. Turn it off per call with `payloadCache: false`, or for the whole app with the [`payloadCache`](/api/module-configuration#apiparty-payloadcache) module option.

Benefits of in-memory caching over browser caching include:

- Support for caching non-GET requests.
- Does not require the server to respond with `Cache-Control`, `ETag`, or `Last-Modified` headers.

Downsides of in-memory caching include:

- Cache does not persist across page reloads.
- Cache is not shared across tabs or windows.
- Refreshing data requires a call to `clear` then `refresh` functions.

## Built-in Browser Caching

To enable persistent caching across page reloads, leverage the browser's [built-in caching mechanism](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching) if your endpoint supports it.

If your endpoint supports client caching, the response is cached by the browser. Subsequent GET requests to the same endpoint return the cached response, if available, without making a new request to the server.

The cached response is used until it expires.

To enable built-in browser caching, set the `cache` option to one of the values in the [options](#cache-options) section below.

::: tip HTTP Caching
To support HTTP caching, you must set [`server.proxyMode`](/api/module-configuration#proxymode) to `'passthrough'` in your `nuxt.config` file. This allows GET requests to be GET requests, which is required for caching to work correctly.

```ts
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],
  apiParty: {
    server: {
      proxyMode: 'passthrough'
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

The `cache` option controls the browser's HTTP cache and accepts the same values as [`Request.cache`](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache).

The available options are:

- `'default'`: Checks the cache. If it is missing or stale, executes the request and stores the cached response.
- `'no-store'`: Always fetch from the server, doesn't update the cache.
- `'reload'`: Reload the resource from the server and update the cache.
- `'no-cache'`: Use the cache, but revalidate with the server before returning the cached response.
- `'force-cache'`: Use the cache, even if it is stale.
- `'only-if-cached'`: Use the cache, but do not make a request to the server if the resource is not in the cache. If the resource is not in the cache, will respond with a 504 Gateway Timeout error.

Payload caching is a separate switch: `payloadCache` takes a boolean and leaves the HTTP cache alone.

For reference, here is a table summarizing the behavior of each cache option:

| Cache Option       | Loads Cache | Stores Cache | Reuses Stale | Makes Request |
| ------------------ | ----------- | ------------ | ------------ | ------------- |
| `'default'`        | ✅          | ✅           | ❌           | ✅            |
| `'no-store'`       | ❌          | ❌           | ❌           | ✅            |
| `'reload'`         | ❌          | ✅           | ❌           | ✅            |
| `'no-cache'`       | ✅          | ❌           | ❌           | ✅            |
| `'force-cache'`    | ✅          | ❌           | ✅           | ✅            |
| `'only-if-cached'` | ✅          | ❌           | ✅           | ❌            |

## Examples

:::: info Demo Setup
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
::::

### Cache in the Payload

Payload caching is on unless you turn it off.

```ts
const { data } = await useJsonPlaceholderData('posts', {
  // The default value is `true`
  payloadCache: true // [!code ++]
})
```

### Refresh Cached Data

`refresh` sends the request again and replaces the cached response. So does `execute` after a `clear`, and so does a reactive request option that changes the key – asking for fresh data is never answered from the cache.

```ts
const { data, refresh } = await useJsonPlaceholderData('posts')

async function reload() {
  await refresh()
}
```

::: warning
`clearNuxtData()` empties Nuxt's own store, not the cache entry this module keeps alongside it. A component mounting afterwards can still resolve from that entry – refresh the call site instead.
:::

### Cache in the Browser

Passing a string value to the `cache` option enables built-in browser caching behavior. This mode only works for GET requests and requires proper cache headers on the endpoint response.

```ts
// Enable browser caching
const { data } = await useJsonPlaceholderData('posts', {
  cache: 'default' // [!code ++]
})
```

### Disable Caching

Each cache has its own switch, so turn off whichever a request should skip.

```ts
const { data } = await useJsonPlaceholderData('posts/1', {
  payloadCache: false, // [!code ++]
  cache: 'no-store' // [!code ++]
})
```

### Refresh Browser Cached Data

For resources that may change frequently, use the `'reload'` option to ensure the browser checks with the server for a fresh response before returning the cached response.

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

Sometimes a button is used to reload data on demand. In this case, you may want to set the cache option to `'reload'` to ensure data is revalidated with the server on refresh. Unfortunately, this makes the first request also use the `'reload'` option, even when there's data in the cache.

There's no builtin way to make the cache use `'default'` for the first request and `'reload'` for manual refreshes, but you can achieve this using a `ref`. Set it to `'default'` initially, then before calling `refresh()`, set it to `'reload'`.

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
