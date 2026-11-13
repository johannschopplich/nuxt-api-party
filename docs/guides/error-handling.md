# Error Handling

The [server proxy](/essentials/how-it-works) passes the API's error through untouched – status code, status message, headers and body all reach your app, so a 404, a validation error and a 500 stay distinguishable. The API's error body lands at `error.data` of the thrown error, and at `error.value.data` of a `useMyApiData` call.

## `useMyApiData` Returns the Error

The `useMyApiData` composables integrate with Nuxt's error handling and expose errors through the `error` property, following Nuxt's [`useAsyncData`](https://nuxt.com/docs/api/composables/use-async-data) pattern:

```vue
<script setup lang="ts">
const { data, error } = await useJsonPlaceholderData<{ title: string }, { message?: string }>('posts/invalid-id')

if (error.value) {
  console.error('Request failed:', error.value.statusText)
  console.error('Status code:', error.value.status)
  console.error('Response data:', error.value.data)
}
</script>

<template>
  <div>
    <div v-if="error">
      <h3>Error: {{ error.statusText }}</h3>
      <p>{{ error.data?.message || 'Something went wrong' }}</p>
    </div>

    <div v-else-if="data">
      <!-- Success content -->
      <h1>{{ data.title }}</h1>
    </div>
  </div>
</template>
```

## `$myApi` Throws

The `$myApi` functions throw errors directly since they're designed for programmatic use (like form submissions or one-time actions):

```vue
<script setup lang="ts">
import type { FetchError } from 'ofetch'

async function createPost() {
  try {
    const result = await $jsonPlaceholder('posts', {
      method: 'POST',
      body: {
        title: 'New Post',
        body: 'Content here'
      }
    })

    console.log('Post created:', result)
  }
  catch (error) {
    const _error = error as FetchError

    console.error('Request failed:', _error.statusMessage)
    console.error('Status code:', _error.statusCode)
    console.error('Response data:', _error.data)
  }
}
</script>
```

## Rethrowing From Your Own Nitro Route

A [server import](/api/server-imports) throws the same error, with the API's body at `error.data`. Rethrowing it with `createError` wraps that body once more: Nitro answers with an error object of its own and puts the body in its `data`, so the browser finds it at `error.data.data`.

To hand the API's error on as it is, answer with its status and body instead of throwing:

```ts [server/api/posts/[id].get.ts]
import type { FetchError } from 'ofetch'

export default defineEventHandler(async (event) => {
  try {
    return await $jsonPlaceholder(`posts/${getRouterParam(event, 'id')}`)
  }
  catch (error) {
    const { statusCode = 500, statusMessage, data } = error as FetchError
    setResponseStatus(event, statusCode, statusMessage)
    return data
  }
})
```

A `$fetch` or `useFetch` call to this route then finds the API's body at `error.data`, as it would for a call through the server proxy.

## Error Types

### `FetchError` Interface

The `FetchError` type from [ofetch](https://github.com/unjs/ofetch) is used for errors thrown by `$myApi` functions:

```ts
interface FetchError<T = any> extends Error {
  request?: FetchRequest
  options?: FetchOptions
  response?: FetchResponse<T>
  data?: T
  status?: number
  statusText?: string
  statusCode?: number
  statusMessage?: string
}
```

### `NuxtError` Interface

The `NuxtError` type is used for errors returned by `useMyApiData` composables. Nuxt lists its properties under [`useError`](https://nuxt.com/docs/api/composables/use-error#type).
