# `$fetch`-Like Composable

Returns the raw API response. Intended for actions inside methods, e.g. when sending form data on submit.

::: info Placeholder
`$myApi` is a placeholder. The composable is generated based on your API endpoint ID. For example, endpoint `jsonPlaceholder` generates `$jsonPlaceholder`.
:::

## Type Declarations

<<< @/../src/runtime/composables/$api.ts#options

## Caching

Customize caching behavior by passing the `cache` option:

```ts
const data = await $myApi('posts', {
  cache: 'no-store' // or 'default', 'reload', 'no-cache', 'force-cache', 'only-if-cached'
})
```

::: tip
See the [caching guide](/guides/caching-strategies) for more information on caching.
:::

## Example

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
const data = await $jsonPlaceholder(
  'posts',
  { client: true }
)
```

::: info
Set the `client` module option to `always` to make all requests on the client-side.
:::

## Custom Fetch

Pass a custom fetch function for different HTTP clients or custom caching logic:

```ts
const data = await $jsonPlaceholder('posts', {
  fetch(url, options) {
    // Support fetching local routes during SSR
    const fetch = useRequestFetch()
    // Custom fetch logic here
    return fetch(url, options)
  }
})
```

::: warning
Custom fetch functions interfere with fetching local routes during SSR, which is required for the proxy to function. Either wrap `useRequestFetch()` as shown, or use custom fetch only for client-side requests.
:::
