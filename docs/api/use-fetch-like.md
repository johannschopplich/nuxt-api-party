# `useFetch`-Like Composable

Returns the raw response of the API endpoint. Intended for data which requires reactive updates, e.g. when using the data in a template.

Responses are **cached** between function calls for the same path based on a calculated hash. You can disable this behavior by setting `cache` to `false`.

The composable supports every [`useAsyncData` option](https://nuxt.com/docs/api/composables/use-async-data/#params).

::: info
`useMyApiData` is a placeholder used as an example in the documentation. The composable is generated based on your API endpoint ID. For example, if you were to call an endpoint `jsonPlaceholder`, the composable will be called `useJsonPlaceholderData`.
:::

## Return Values

- `data`: the result of the asynchronous function that is passed in.
- `refresh`/`execute`: a function that can be used to refresh the data returned by the `handler` function.
- `error`: an error object if the data fetching failed.
- `status`: a string indicating the status of the data request (`'idle'`, `'pending'`, `'success'`, `'error'`).
- `clear`: a function which will set `data` to `undefined`, set `error` to `null`, set `status` to `'idle'`, and mark any currently pending requests as cancelled.

By default, Nuxt waits until a `refresh` is finished before it can be executed again.

## Type Declarations

<<< @/../src/runtime/composables/useApiData.ts#types

## Caching

By default, a [unique key is generated](/guide/caching) based in input parameters for each request to ensure that data fetching can be properly de-duplicated across requests. You can provide a custom key with the `key` option (similar to the key passed to [`useAsyncData`](https://nuxt.com/docs/api/composables/use-async-data)'s first argument):

```ts
const route = useRoute()

const { data } = await useMyApiData('posts', {
  key: () => `posts-${route.params.id}`
})
```

::: tip
The key can be a reactive value, e.g. a computed property.
:::

### Time to Live (TTL)

You can set a max age or time-to-live (TTL) for the cached data by passing an object to `cache` with a `ttl` property. By default, responses will be cached forever. This will automatically invalidate the cache after the specified time in milliseconds:

```ts
const { data } = useMyApiData('posts', {
  cache: {
    ttl: 1000 * 60 * 5
  } // Cache for 5 minutes
})
```

::: warning
Old responses will not be removed from the cache immediately after the TTL expires, but will be considered stale and will not be used for new requests. The next request will fetch fresh data from the server.

If you want to remove the cached data, you can use the `clear` function as described below.
:::

::: tip
`ttl` is ignored during manual refreshes, meaning that if you call `refresh()`, the data will be fetched from the server regardless of the TTL.
:::

### Clearing cached data

Clear the cache for a specific query by calling the `clear` function. This will remove the cached data for the query and allow the next request to fetch the data from the server:

```ts
const { data, refresh, clear } = await useMyApiData('posts')

async function invalidateAndRefresh() {
  clear()
  await refresh()
}
```

::: info
`refresh()` will automatically invalidate the cache, but manually calling `clear()` can be useful if you want to reset the state without making a new request immediately.
:::

## Examples

::: info
The examples below assume that you have set up an API endpoint called `jsonPlaceholder`:

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

### Basic

```vue
<script setup lang="ts">
const { data, refresh, error, status, clear } = await useJsonPlaceholderData('posts/1')
</script>

<template>
  <div>
    <h1>{{ data?.title }}</h1>
    <button @click="refresh()">
      Refresh
    </button>
  </div>
</template>
```

### Extended example

```vue
<script setup lang="ts">
const postId = ref(1)

const { data, pending, refresh, error } = await useJsonPlaceholderData('comments', {
  // Whether to resolve the async function after loading the route, instead of blocking client-side navigation (defaults to `false`)
  lazy: true,
  // A factory function to set the default value of the data, before the async function resolves - particularly useful with the `lazy: true` option
  default: () => ({
    title: ''
  }),
  // A function that can be used to alter handler function result after resolving
  transform: res => res,
  // Custom query parameters to be added to the request, can be reactive
  query: computed(() => ({
    postId: postId.value
  })),
  // Custom headers to be sent with the request
  headers: {
    'X-Foo': 'bar'
  }
})
</script>

<template>
  <div>
    <h1>{{ data?.title }}</h1>
    <button @click="refresh()">
      Refresh
    </button>
  </div>
</template>
```

## Client Requests

::: warning
Authorization credentials will be publicly visible. Also, possible CORS issues ahead if the backend is not configured properly.
:::

::: info
Note: If Nuxt SSR is disabled, all requests are made on the client-side by default.
:::

To fetch data directly from your API and skip the Nuxt server proxy, set the `apiParty` module option `client` to `true`:

```ts{9}
// `nuxt.config.ts`
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

Now you can make client-side requests by setting the `client` option to `true` in the composable.

```ts{3}
const data = await useJsonPlaceholderData(
  'posts',
  { client: true }
)
```

::: info
Set the `client` module option to `always` to make all requests on the client-side.
:::
