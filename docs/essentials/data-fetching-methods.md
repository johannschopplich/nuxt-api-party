# Data Fetching Methods

Each endpoint gives you two composables: `useMyApiData` is built on Nuxt's `useFetch`, and `$myApi` is a plain `$fetch`. They differ in what they return and in who decides when the request goes out.

## Comparison

|                     | `useMyApiData`                                                                    | `$myApi`                          |
| ------------------- | --------------------------------------------------------------------------------- | --------------------------------- |
| **Returns**         | [`AsyncData`](https://nuxt.com/docs/api/composables/use-async-data#return-values)  | A promise of the response data    |
| **On failure**      | A reactive `error` value                                                          | Throws                            |
| **Caching**         | Nuxt payload, with `getCachedData` and deduplication                              | None of its own                   |
| **Server rendering**| Hydrates automatically                                                            | Fetches again on hydration        |
| **Reach for it**    | Page and component data                                                           | Mutations and programmatic calls  |

## Reactive Data Fetching

Use `useMyApiData` composables in components and pages. They hook into Nuxt's hydration and caching, so server-rendered data is not fetched a second time in the browser.

```vue
<script setup lang="ts">
const postId = ref(1)

// The request is sent again when `postId` changes
const { data } = await useJsonPlaceholderData<{ title: string }>(() => `posts/${postId.value}`)

function nextPost() {
  postId.value++
}
</script>

<template>
  <div>
    <h1>{{ data?.title }}</h1>
    <button @click="nextPost()">
      Next Post
    </button>
  </div>
</template>
```

## Direct API Calls

Use `$myApi` composables for programmatic API interactions, form submissions, and one-time actions where you need direct control over request timing.

::: warning `$myApi` in Component Setup
`$myApi` is a plain fetch. Awaited in a component's setup, it runs during SSR and once more in the browser while the page hydrates. Fetch page data with `useMyApiData`, or wrap the call in `useAsyncData` – see the [`$myApi` documentation](/api/dollarfetch-like#in-component-setup).
:::

In a submit handler, catch the error `$myApi` throws – see [`$myApi` Throws](/guides/error-handling#myapi-throws).

In plugins or middleware, use `$myApi` for initial data fetching. Keep the result in `useState`, so the browser takes it from the payload instead of fetching it again:

::: code-group
```ts [plugins/api-setup.ts]
export default defineNuxtPlugin(async () => {
  const settings = useState<Record<string, unknown> | null>('app.settings', () => null)

  // Hydrated from the server's response
  if (settings.value)
    return

  try {
    settings.value = await $jsonPlaceholder('settings')
  }
  catch (error) {
    console.error('Failed to load settings:', error)
  }
})
```
:::

From here, [Module Configuration](/api/module-configuration) lists every option an endpoint accepts, and [OpenAPI Integration](/guides/openapi-integration) shows how to infer request and response types from a schema.
