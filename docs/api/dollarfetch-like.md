# `$fetch`-Like Composable

Returns the raw response of the API endpoint. Intended for actions inside methods, e.g. when sending form data to the API when clicking a submit button.

::: info
`$myApi` is a placeholder used as an example in the documentation. The composable is generated based on your API endpoint ID. For example, if you were to call an endpoint `jsonPlaceholder`, the composable will be called `$jsonPlaceholder`.
:::

## Type Declarations

```ts
interface SharedFetchOptions {
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
   * @default false
   */
  cache?: boolean
  /**
   * By default, a cache key will be generated from the request options.
   * With this option, you can provide a custom cache key.
   * @default undefined
   */
  key?: string
}

type ApiClientFetchOptions
  = Omit<NitroFetchOptions<string>, 'body' | 'cache'>
    & {
      path?: Record<string, string>
      body?: string | Record<string, any> | FormData | null
    }

function $Api<T = unknown>(
  path: string,
  opts?: ApiClientFetchOptions & SharedFetchOptions
): Promise<T>
```

## Caching

By default, a [unique key is generated](/guide/caching) based in input parameters for each request to ensure that data fetching can be properly de-duplicated across requests. You can provide a custom key with the `key` option:

```ts
const route = useRoute()

const data = await $myApi('posts', {
  key: `posts-${route.params.id}`
})
```

## Example

::: info
The example below assume that you have set up an API endpoint called `jsonPlaceholder`:

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

```vue
<script setup lang="ts">
const data = await $jsonPlaceholder(
  'posts',
  {
    method: 'POST',
    body: {
      foo: 'bar'
    },
    async onRequest({ request }) {
      console.log(request)
    },
    async onResponse({ response }) {
      console.log(response)
    },
    async onRequestError({ error }) {
      console.log(error)
    },
    async onResponseError({ error }) {
      console.log(error)
    }
  }
)
</script>

<template>
  <div>
    <h1>{{ data?.title }}</h1>
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
const data = await $jsonPlaceholder(
  'posts',
  { client: true }
)
```

::: info
Set the `client` module option to `always` to make all requests on the client-side.
:::

::: warning
Client-side requests are not supported during server-side rendering (SSR). If you enable client requests in a server-side context, it will throw an error.

You should prefer either to use the [`useFetch`-like](./use-fetch-like) composable, or wrap the call in [`useAsyncData`](https://nuxt.com/docs/api/composables/use-async-data) with `{ server: false }` to ensure the request is only made on the client.

```ts
const { data } = useAsyncData(
  'posts',
  () => $jsonPlaceholder(
    'posts',
    { client: true }
  ),
  {
    server: false
  }
)
```
:::
