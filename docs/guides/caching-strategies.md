# Caching Strategies

A response can be reused from two places: the Nuxt payload, which is fast and lives for the page, and the browser's HTTP cache, which survives reloads. Nuxt's `getCachedData` option decides on the former, the `cache` option on the latter.

<!--@include: ../parts/_demo-setup.md-->

## Payload Caching

`useMyApiData` stores its response in the Nuxt payload under its key, the way `useFetch` does. A response fetched during SSR reaches the browser that way, and hydration reuses it instead of sending the request again.

After hydration, Nuxt's default `getCachedData` sends every request again. To answer a repeated request from the payload instead – after a client-side navigation back to the page, say – pass a `getCachedData` of your own:

```ts
const { data, refresh } = await useJsonPlaceholderData('posts', {
  // `refresh()`, `refreshNuxtData()` and a changed `watch` source still fetch.
  getCachedData: (key, nuxtApp, { cause }) =>
    cause === 'initial' ? nuxtApp.payload.data[key] : undefined
})
```

Nuxt calls `getCachedData` on a refresh and a change of a `watch` source, too, so a function that always returns the payload entry answers those from the cache as well. A `getCachedData` of your own also keeps Nuxt from purging the entry once no component uses it any more, which is what lets a navigation back to the page find it.

`$myApi` stores nothing in the payload. Wrap it in `useAsyncData` to cache its response there – see [the `$fetch`-like composable](/api/dollarfetch-like#in-component-setup).

Payload caching works for every method and needs nothing from the API, but it does not survive a page reload and is not shared across tabs.

### Refresh Cached Data

`refresh` sends the request again, and so do `execute` after a `clear` and a reactive request option that changes the key – unless a `getCachedData` of your own answers them from the payload.

```ts
const { data, refresh } = await useJsonPlaceholderData('posts')

async function reload() {
  await refresh()
}
```

## Browser Caching

The browser's [HTTP cache](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching) survives page reloads. A GET request through the [server proxy](/essentials/how-it-works) stays a GET request, and the proxy passes the API's cache headers through, so the browser caches it like any other response.

For that, the API has to:

- Answer the request under `GET`.
- Respond with cache headers, such as `Cache-Control`, `ETag` or `Last-Modified`.

During SSR, the request never reaches a browser, so only calls made in the browser use the HTTP cache.

### Cache Options

The `cache` option is passed to `fetch` as [`Request.cache`](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache) and accepts its values:

- `'default'`: Checks the cache. If it is missing or stale, executes the request and stores the cached response.
- `'no-store'`: Always fetch from the server, doesn't update the cache.
- `'reload'`: Reload the resource from the server and update the cache.
- `'no-cache'`: Use the cache, but revalidate with the server before returning the cached response.
- `'force-cache'`: Use the cache, even if it is stale.
- `'only-if-cached'`: Use the cache, but do not make a request to the server if the resource is not in the cache. If the resource is not in the cache, will respond with a 504 Gateway Timeout error.

### Skip the Browser Cache

```ts
const { data } = await useJsonPlaceholderData('posts/1', {
  cache: 'no-store' // [!code ++]
})
```

### Revalidate Browser Cached Data

For resources that may change frequently, use the `'no-cache'` option to make the browser check with the server before returning the cached response.

::: info
This mode will make a conditional request to the server, and if the resource has not changed, it should return a `304 Not Modified` response, allowing the browser to reuse the cached response.

The API should check the request headers `If-None-Match` or `If-Modified-Since` to determine whether the resource has changed.
:::

```ts
const { data } = await useJsonPlaceholderData('posts', {
  cache: 'no-cache' // [!code ++]
})
```

A ref passed as `cache` is watched like every other option, so changing it sends the request again under the new mode.
