# Retries

From time to time, fetch requests may fail. This can happen for a variety of reasons, like a network error or a server error. In these cases, you may want to retry the request a few times before giving up.

You can configure retries for a single request by passing a `retry` option to the `useMyApiData` and `$myApi` composables. It can be a number, `false` or `undefined`, either reactive or not:

```ts
const retry = ref(3)

// Retry failed requests 3 times
const { data } = await useJsonPlaceholderData('posts/1', {
  retry: retry.value,
  retryDelay: 500 // Milliseconds
})
```

By default, the `retry` option is set to `undefined`, meaning that no retries will be attempted.

::: info
These examples assume that you have set up an API endpoint called `jsonPlaceholder`:

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

## Timeout

You can specify `timeout` in milliseconds to automatically abort request after a timeout. This option is useful when you want to limit the time spent waiting for a response. It is disabled by default.

```ts
const { data } = await useJsonPlaceholderData('posts/1', {
  // Timeout after 3 seconds
  timeout: 3000
})
```
