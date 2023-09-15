# `useMyApiData`

::: info
`useMyApiData` is a placeholder used as an example in the documentation. The composable is generated based on your API endpoint ID. For example, if you were to call an endpoint `jsonPlaceholder`, the composable will be called `useJsonPlaceholderData`.
:::

Returns the raw response of the API endpoint. Intended for data which requires reactive updates, e.g. when using the data in a template.

Responses are **cached** between function calls for the same path based on a calculated hash. You can disable this behavior by setting `cache` to `false`.

The composable supports every [`useAsyncData` option](https://nuxt.com/docs/api/composables/use-async-data/#params).

## Return Values

- **data**: the response of the API request
- **pending**: a boolean indicating whether the data is still being fetched
- **refresh**: a function that can be used to refresh the data returned by the handler function
- **error**: an error object if the data fetching failed

By default, Nuxt waits until a `refresh` is finished before it can be executed again. Passing `true` as parameter skips that wait.

## Type Declarations

```ts
type BaseUseApiDataOptions<T> = Omit<AsyncDataOptions<T>, 'watch'> & {
  /**
   * Skip the Nuxt server proxy and fetch directly from the API.
   * Requires `allowClient` to be enabled in the module options as well.
   * @default false
   */
  client?: boolean
  /**
   * Cache the response for the same request
   * @default true
   */
  cache?: boolean
  /**
   * Watch an array of reactive sources and auto-refresh the fetch result when they change.
   * Fetch options and URL are watched by default. You can completely ignore reactive sources by using `watch: false`.
   */
  watch?: (WatchSource<unknown> | object)[] | false
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
  pathParams?: MaybeRef<Record<string, string>>
  body?: MaybeRef<string | Record<string, any> | FormData | null | undefined>
} & BaseUseApiDataOptions<T>

function UseApiData<T = any>(
  path: MaybeRefOrGetter<string>,
  opts?: UseApiDataOptions<T>
): AsyncData<T | undefined, FetchError>
function UseApiData<T = any>(
  key: MaybeRefOrGetter<string>,
  path: MaybeRefOrGetter<string>,
  opts?: UseApiDataOptions<T>
): AsyncData<T | undefined, FetchError>
```

## Caching

By default, a [unique key for each request is generated](/guide/caching) to ensure that data fetching can be properly de-duplicated across requests. You can provide a custom key by passing a string as the first argument, just like the native [`useAsyncData`](https://nuxt.com/docs/api/composables/use-async-data):

```ts
const key = 'all-posts'

const { data } = await useMyApiData(
  key,
  'posts'
)
```

::: tip
The key can be a reactive value, e.g. a computed property.
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
const { data, pending, error, refresh } = await useJsonPlaceholderData('posts/1')
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

To fetch data directly from your API, without the Nuxt proxy, set the option `client` to `true`:

```ts{3}
const { data } = await useJsonPlaceholderData(
  'comments',
  { client: true }
)
```

Requires the `allowClient` option to be `true` in your `apiParty` module configuration:

```ts{9}
// `nuxt.config.ts`
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    endpoints: {
      // ...
    },
    allowClient: true
  }
})
```
