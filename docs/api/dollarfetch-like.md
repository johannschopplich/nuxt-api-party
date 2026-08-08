# `$fetch`-Like Composable

Returns the raw API response. Intended for actions inside methods, e.g. when sending form data on submit.

::: info Placeholder
`$myApi` is a placeholder. The composable is generated based on your API endpoint ID. For example, endpoint `jsonPlaceholder` generates `$jsonPlaceholder`.
:::

## Type Declarations

<<< @/../src/runtime/composables/$api.ts#options

## Caching

Payload caching is off by default here; `payloadCache: true` turns it on. The `cache` option controls the browser's HTTP cache separately:

```ts
const data = await $myApi('posts', {
  cache: 'no-store' // or 'default', 'reload', 'no-cache', 'force-cache', 'only-if-cached'
})
```

<!--@include: ./parts/_http-cache-caveat.md-->

## Examples

<!--@include: ../parts/_demo-setup.md-->

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

## Using With `useAsyncData`

::: warning Nuxt Context Issue
Calling `$myApi` multiple times sequentially inside `useAsyncData` causes server-side errors related to Nuxt context loss. This happens because async operations break the context chain that Nuxt uses to track composable calls.
:::

When you need to make multiple API calls inside `useAsyncData`, use one of these workarounds:

### Option 1: Use `callWithNuxt` Helper

Wrap subsequent calls with `callWithNuxt` to restore the Nuxt context:

```ts
import { callWithNuxt } from '#app'

const { data } = await useAsyncData(async (nuxt) => {
  const firstResult = await $myApi('/path1')

  // Wrap the second call to restore context
  const secondResult = await callWithNuxt(nuxt!, async () =>
    await $myApi('/path2'))

  return { firstResult, secondResult }
})
```

### Option 2: Use `useMyApiData` Instead

For reactive data fetching within components, prefer `useMyApiData` composables which handle Nuxt context automatically:

```ts
// Instead of using $myApi inside useAsyncData...
const { data: posts } = await useMyApiData('posts')
const { data: comments } = await useMyApiData('comments')
```

::: tip Best Practice
Use `useMyApiData` for component data and `$myApi` for programmatic actions (form submissions, mutations). This avoids context issues and provides better caching and reactivity.
:::

## Client Requests

<!--@include: ./parts/_client-requests.md-->

## Custom Fetch

Pass a custom fetch function for different HTTP clients or custom caching logic:

```ts
const data = await $jsonPlaceholder('posts', {
  $fetch(request, options) {
    // Wrapping `useRequestFetch()` keeps local routes fetchable during SSR
    return useRequestFetch()(request, options)
  }
})
```

::: warning
Custom fetch functions interfere with fetching local routes during SSR, which is required for the proxy to function. Either wrap `useRequestFetch()` as shown, or use custom fetch only for client-side requests.
:::
