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
    cause === 'initial'
      ? nuxtApp.payload.data[key]
      : undefined
})
```

Nuxt calls `getCachedData` on a refresh and a change of a `watch` source, too, so a function that always returns the payload entry answers those from the cache as well. A `getCachedData` of your own also keeps Nuxt from purging the entry once no component uses it any more, which is what lets a navigation back to the page find it.

`$myApi` stores nothing in the payload. Wrap it in `useAsyncData` to cache its response there – see [the `$fetch`-like composable](/api/dollarfetch-like#in-component-setup).

Payload caching works for every method and needs nothing from the API, but it does not survive a page reload and is not shared across tabs.

### Refresh Cached Data

`refresh` sends the request again, and so do `execute` after a `clear` and a reactive request option that changes the key – unless a `getCachedData` of your own answers them from the payload.

## Browser Caching

The browser's [HTTP cache](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching) survives page reloads. A GET request through the [server proxy](/essentials/how-it-works) stays a GET request, and the proxy passes the API's cache headers through, so the browser caches it like any other response.

For that, the API has to:

- Answer the request under `GET`.
- Respond with cache headers, such as `Cache-Control`, `ETag` or `Last-Modified`.

During SSR, the request never reaches a browser, so only calls made in the browser use the HTTP cache.

### Cache Options

The `cache` option is passed to `fetch` as [`Request.cache`](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache) and takes its values. `'no-store'` skips the browser cache. `'no-cache'` revalidates with the API before reusing a cached response, which suits resources that change often and needs an API that answers `If-None-Match` or `If-Modified-Since` with `304 Not Modified` when nothing changed:

```ts
const { data } = await useJsonPlaceholderData('posts', {
  cache: 'no-cache'
})
```

A ref passed as `cache` is watched like every other option, so changing it sends the request again under the new mode.
