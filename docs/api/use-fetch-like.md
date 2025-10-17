# `useFetch`-Like Composable

Returns the raw API response. Intended for data that requires reactive updates, e.g. when using data in templates.

Responses are **cached** between function calls for the same path based on a calculated hash. Disable this by setting `cache` to `false`.

Supports every [`useAsyncData` option](https://nuxt.com/docs/api/composables/use-async-data/#params).

::: info Placeholder
`useMyApiData` is a placeholder. The composable is generated based on your API endpoint ID. For example, endpoint `jsonPlaceholder` generates `useJsonPlaceholderData`.
:::

## Return Values

- **`data`**: result of the asynchronous function.
- **`refresh`/`execute`**: function to refresh the data returned by the handler.
- **`error`**: error object if data fetching failed.
- **`status`**: string indicating the status of the data request:
  - `idle`: when the request has not started, such as:
    - when `execute` has not yet been called and `{ immediate: false }` is set
    - when rendering HTML on the server and `{ server: false }` is set
  - `pending`: the request is in progress
  - `success`: the request has completed successfully
  - `error`: the request has failed
- **`clear`**: function to set `data` to `undefined` (or `options.default()` value if provided), set `error` to `undefined`, set `status` to `idle`, and mark pending requests as cancelled.

By default, Nuxt waits until a `refresh` is finished before it can be executed again.

## Type Declarations

<<< @/../src/runtime/composables/useApiData.ts#options

## Caching

Customize caching behavior by passing the `cache` option:

```ts
const { data } = await useMyApiData('posts', {
  cache: 'no-store' // or 'default', 'reload', 'no-cache', 'force-cache', 'only-if-cached'
})
```

::: tip
See the [caching guide](/guides/caching-strategies) for more information on caching.
:::

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

::: code-group
```ts{9} [nuxt.config.ts]
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
:::

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
