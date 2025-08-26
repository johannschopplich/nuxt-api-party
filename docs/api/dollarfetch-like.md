# `$fetch`-Like Composable

Returns the raw response of the API endpoint. Intended for actions inside methods, e.g. when sending form data to the API when clicking a submit button.

::: info
`$myApi` is a placeholder used as an example in the documentation. The composable is generated based on your API endpoint ID. For example, if you were to call an endpoint `jsonPlaceholder`, the composable will be called `$jsonPlaceholder`.
:::

## Type Declarations

<<< @/../src/runtime/composables/$api.ts#options

## Caching

You can customize the caching behavior by passing the `cache` option to the composable.

```ts
const data = await $myApi(
  'posts',
  {
    cache: 'no-store' // or 'default', 'reload', 'no-cache', 'force-cache', 'only-if-cached'
  }
)
```

::: tip
See the [caching guide](../guide/caching.md) for more information on caching.
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

## Custom Fetch

You can pass a custom fetch function to the composable. This is useful if you want to use a different HTTP client or implement custom caching logic.

```ts
const data = await $jsonPlaceholder(
  'posts',
  {
    fetch(url, options) {
      // Support fetching local routes during SSR
      const fetch = useRequestFetch()
      // Custom fetch logic here
      return fetch(url, options)
    }
  }
)
```

::: warning
Using a custom fetch function will interfere with fetching local routes during SSR, which is required for the proxy to function. If you need to use a custom fetch function, be sure you either wrap `useRequestFetch()` as in the example, or only use it for client-side requests.
:::
