# Retries

From time to time, fetch requests may fail. This can happen for a variety of reasons, like a network error or a server error. In these cases, you may want to retry the request a few times before giving up.

You can configure retries for a single request by passing a `retry` option to the `useApiPartyData` and `$apiParty` composables. It can be a number, `false` or `undefined`, either reactive or not:

```ts
const retry: MaybeRef<number | false | undefined>
```

Example:

```ts
// Retry failed requests 3 times
const { data } = await useJsonPlaceholderData('posts/1', {
  retry: 3,
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
