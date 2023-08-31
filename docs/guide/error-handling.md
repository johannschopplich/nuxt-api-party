# Error Handling

While the idea of this Nuxt module is to mask your real API (and credentials) by creating a server proxy, `nuxt-api-party` will minimize the hassle of handling errors by passing the following properties to the client:

- Response body
- HTTP status code
- HTTP status message
- Headers

Thus, if your API fails to deliver, you can still handle the error response in your Nuxt app just like you would with a direct API call.

Both [generated composables](/api/) per endpoint will throw an [ofetch](https://github.com/unjs/ofetch) `FetchError` if your API fails to deliver.

Logging the available error properties will provide you insights on what went wrong:

```ts
console.log(error.statusCode) // `404`
console.log(error.statusMessage) // `Not Found`
console.log(error.data) // Whatever your API returned
```

See all available examples below.

## `FetchError` Type Declaration

```ts
// See https://github.com/unjs/ofetch
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

## Examples

::: info
The examples below assume that you have set up an API endpoint called `jsonPlaceholder`:

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

### Usage with `useJsonPlaceholderData`

When using the `useMyApiData` composable, the `error` is already typed as a `FetchError`.

```ts
const { data, error } = await useJsonPlaceholderData('not/available')

watchEffect(() => {
  if (error.value)
    console.error(error.value.data)
})
```

### Usage with `$jsonPlaceholder`

```ts
import type { FetchError } from 'ofetch'

function onSubmit() {
  try {
    const response = await $jsonPlaceholder('not/available', {
      method: 'POST',
      body: form.value
    })
  }
  catch (error) {
    console.error((error as FetchError).data)
  }
}
```
