# `$fetch`-Like Composable

Returns the raw response of the API endpoint. Intended for actions inside methods, e.g. when sending form data to the API when clicking a submit button.

::: info
`$myApi` is a placeholder used as an example in the documentation. The composable is generated based on your API endpoint ID. For example, if you were to call an endpoint `jsonPlaceholder`, the composable will be called `$jsonPlaceholder`.
:::

## Type Declarations

<<< @/../src/runtime/composables/$api.ts#types

## Caching

Client caching can be done using your browser's builtin [Request cache](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache) if the backend server supports [HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching).

You can customize the caching behavior by passing the `cache` option to the composable.

```ts
const data = await $myApi(
  'posts',
  {
    cache: 'no-store' // or 'default', 'reload', 'no-cache', 'force-cache', 'only-if-cached'
  }
)
```

::: note
Previous versions of this module used the `cache` option as a boolean to control whether a response was cached for the session. This stored each response in memory with no cleanup, which was wasteful and not compatible with Nuxt 3.17's `experimental.purgeCachedData` option. The `cache` option now follows the [Request cache](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache) specification.

If you previously used the `cache` option as a boolean, you can achieve similar behavior by using either `no-store` for `false` or `default` for `true`.
:::

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
