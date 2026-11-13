# `useFetch`-Like Composable

Returns the API response as Nuxt async data. Intended for data that requires reactive updates, e.g. when using data in templates.

`useMyApiData` is built on Nuxt's own [`useFetch`](https://nuxt.com/docs/api/composables/use-fetch), so it takes every `useFetch` option – `key`, `lazy`, `server`, `immediate`, `default`, `transform`, `pick`, `watch`, `getCachedData`, `dedupe` and the rest – and returns the same `AsyncData`. Only the options that pick where a request goes – `baseURL` and `$fetch` – are the endpoint's to decide, and `params` is left out in favor of `query`.

::: info Placeholder
`useMyApiData` is a placeholder. The composable is generated based on the endpoint ID. For example, endpoint `jsonPlaceholder` generates `useJsonPlaceholderData`.
:::

## Return Values

`useMyApiData` returns `data`, `refresh` (alias `execute`), `error`, `status` and `clear`, as [`useFetch`](https://nuxt.com/docs/api/composables/use-fetch#return-values) does.

By default, a `refresh` called while a request is pending cancels that request and sends a new one. Pass `dedupe: 'defer'` to wait for the pending one instead.

## Type Declarations

<<< @/../src/runtime/composables/useApiData.ts#options

The generic parameters follow `useFetch`: `ResT` types the response, `ErrorT` the error body, and `DataT` what `transform` turns the response into. `data` is typed after `transform`, `pick` and `default`.

## Request Options

`path`, `query`, `body` and `method` accept a plain value, a ref or a getter, and `headers` a plain value or a ref. The request is sent again whenever one of them changes:

```ts
const postId = ref(1)

const { data } = await useJsonPlaceholderData('comments', {
  query: () => ({ postId: postId.value })
})
```

Path parameters are resolved into the request URL, so each value gets a cache key of its own. With a `key` of your own, the key stays the same, and a changed path parameter or a getter passed as `query` sends no request – name its source in `watch`.

## Caching

A response fetched during SSR reaches the browser in the Nuxt payload, and hydration reuses it instead of sending the request again. Beyond that, Nuxt's `getCachedData` decides when a call is answered from the payload – see [Caching Strategies](/guides/caching-strategies).

## Examples

<!--@include: ../parts/_demo-setup.md-->

### Basic

```vue
<script setup lang="ts">
const { data, refresh, error, status, clear } = await useJsonPlaceholderData<{ title: string }>('posts/1')
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

### Extended

```vue
<script setup lang="ts">
interface Comment {
  id: number
  postId: number
  body: string
}

const postId = ref(1)

const { data, status, refresh, error } = await useJsonPlaceholderData('comments', {
  // Whether to resolve the async function after loading the route, instead of blocking client-side navigation (defaults to `false`)
  lazy: true,
  // A factory function to set the default value of the data, before the async function resolves - particularly useful with the `lazy: true` option
  default: () => [] as Comment[],
  // A function that can be used to alter handler function result after resolving
  transform: (comments: Comment[]) => comments.filter(comment => comment.body.length > 0),
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
    <p v-for="comment in data" :key="comment.id">
      {{ comment.body }}
    </p>
    <button @click="refresh()">
      Refresh
    </button>
  </div>
</template>
```

## Client Endpoints

<!--@include: ./parts/_client-endpoints.md-->
