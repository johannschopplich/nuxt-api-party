# Error Handling

While the idea of this Nuxt module is to mask your real API (and credentials) within the server proxy, `nuxt-api-party` will minimize the hassle of handling errors by passing through the following properties to the response on the client:

- Response body
- HTTP status code
- HTTP status message
- Headers

Thus, if the request to your API fails, you can still handle the error response in your Nuxt app just like you would with a direct API call. In this case, both [generated composables](/api/) per endpoint will throw a `NuxtError` if your API fails to deliver.

Logging the available error properties will provide you insights on what went wrong:

```ts
console.log(error.statusCode) // `404`
console.log(error.statusMessage) // `Not Found`
console.log(error.data) // Whatever your API returned
```

See all available examples below.

## `NuxtError` Type Declaration

```ts
interface NuxtError<DataT = unknown> extends H3Error<DataT> {}

// See https://github.com/unjs/h3
class H3Error<DataT = unknown> extends Error {
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
  toJSON(): Pick<H3Error<DataT>, 'data' | 'statusCode' | 'statusMessage' | 'message'>
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

When using the `useMyApiData` composable, the `error` is already typed as a `NuxtError`.

```ts
const { data, error } = await useJsonPlaceholderData('not/available')

watchEffect(() => {
  if (error.value)
    console.error(error.value.data)
})
```

### Usage with `$jsonPlaceholder`

```ts
import type { NuxtError } from '#app'

function onSubmit() {
  try {
    const response = await $jsonPlaceholder('not/available', {
      method: 'POST',
      body: form.value
    })
  }
  catch (error) {
    console.error((error as NuxtError).data)
  }
}
```
