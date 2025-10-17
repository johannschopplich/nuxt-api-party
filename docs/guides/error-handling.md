# Error Handling

Nuxt API Party provides comprehensive error handling that preserves error details from your API while keeping credentials secure through the [server proxy](/advanced/how-it-works). Whether an API returns a 404, validation error, or server failure, you get complete error information to handle gracefully.

## Error Types

### Composables – `useMyApiData`

The `useMyApiData` composables integrate with Nuxt's error handling and expose errors through the `error` property, following Nuxt's [`useAsyncData`](https://nuxt.com/docs/api/composables/use-async-data) pattern:

```vue
<script setup lang="ts">
const { data, error } = await useJsonPlaceholderData('posts/invalid-id')

if (error.value) {
  console.error('Request failed:', error.value.statusMessage)
  console.error('Status code:', error.value.statusCode)
  console.error('Response data:', error.value.data)
}
</script>

<template>
  <div>
    <div v-if="error">
      <h3>Error: {{ error.statusMessage }}</h3>
      <p>{{ error.data?.message || 'Something went wrong' }}</p>
    </div>

    <div v-else-if="data">
      <!-- Success content -->
      <h1>{{ data.title }}</h1>
    </div>
  </div>
</template>
```

### Functions – `$myApi`

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

## Error Information

Both error types preserve essential information from your API response:

- **Response Body** – Full error details from your API
- **HTTP Status Code** – Standard HTTP status codes (401, 404, 500, etc.)
- **HTTP Status Message** – Human-readable status text
- **Headers** – Response headers from your API

## Type Declaration

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

The `NuxtError` type is used for errors returned by `useMyApiData` composables:

```ts
interface NuxtError<DataT = unknown> extends H3Error<DataT> {
  error?: true
}

declare class H3Error<DataT = unknown> extends Error {
  static __h3_error__: boolean
  statusCode: number
  fatal: boolean
  unhandled: boolean
  statusMessage?: string
  data?: DataT
  cause?: unknown
  constructor(message: string, opts?: {
    cause?: unknown
  })
  toJSON(): Pick<H3Error<DataT>, 'message' | 'statusCode' | 'statusMessage' | 'data'>
}
```
