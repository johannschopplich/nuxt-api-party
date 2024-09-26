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

```ts
type SharedAsyncDataOptions<ResT, DataT = ResT> = Omit<AsyncDataOptions<ResT, DataT>, 'watch'> & {
  /**
   * Skip the Nuxt server proxy and fetch directly from the API.
   * Requires `client` set to `true` in the module options.
   * @remarks
   * If Nuxt SSR is disabled, client-side requests are enabled by default.
   * @default false
   */
  client?: boolean
  /**
   * Cache the response for the same request.
   * You can customize the cache key with the `key` option.
   * @default true
   */
  cache?: boolean
  /**
   * By default, a cache key will be generated from the request options.
   * With this option, you can provide a custom cache key.
   * @default undefined
   */
  key?: MaybeRefOrGetter<string>
  /**
   * Watch an array of reactive sources and auto-refresh the fetch result when they change.
   * Fetch options and URL are watched by default. You can completely ignore reactive sources by using `watch: false`.
   * @default undefined
   */
  watch?: MultiWatchSources | false
}

type UseApiDataOptions<T> = Pick<
  ComputedOptions<NitroFetchOptions<string>>,
  | 'onRequest'
  | 'onRequestError'
  | 'onResponse'
  | 'onResponseError'
  | 'query'
  | 'headers'
  | 'method'
  | 'retry'
  | 'retryDelay'
  | 'timeout'
> & {
  path?: MaybeRefOrGetter<Record<string, string>>
  body?: MaybeRef<string | Record<string, any> | FormData | null>
} & SharedAsyncDataOptions<T>

function UseApiData<T = unknown>(
  path: MaybeRefOrGetter<string>,
  opts?: UseApiDataOptions<T>
): AsyncData<T | null, NuxtError>
```

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

Clear the cache for a specific query by calling the `clear` function. This will remove the cached data for the query and allow the next request to fetch the data from the server:

```ts
const { data, refresh, clear } = await useMyApiData('posts')

async function invalidateAndRefresh() {
  clear()
  await refresh()
}
```

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
