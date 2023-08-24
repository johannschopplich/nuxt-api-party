# How to Track Errors

Although the idea of this module is to mask your real API by creating a Nuxt server proxy, `nuxt-api-party` will still forward some error data to the client if your API fails to deliver, including:

- `statusCode` (or `status`)
- `statusMessage` (or `statusText`)
- `data`

This ensures you can still track errors in your client-side code.

With the latter property `data`, you can access the **error response body** returned from your API:

```ts
import type { FetchError } from '#nuxt-api-party'

// Log your API's error response
console.error('Error response body:', (error as FetchError).data)
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

```ts
const { data, error } = await useJsonPlaceholderData('not/available')

watchEffect(() => {
  if (!error.value)
    return
  console.error('Status code:', error.value.statusCode)
  console.error('Status message:', error.value.statusMessage)
  // Log the API response body
  console.error('API Response:', error.value.data)
})
```

### Usage with `$jsonPlaceholder`

```ts
import type { FetchError } from '#nuxt-api-party'

function onSubmit() {
  try {
    const response = await $jsonPlaceholder('not/available', {
      method: 'POST',
      body: form.value
    })
  }
  catch (error) {
    console.error(error as FetchError)
    // Log the API response body
    console.error('API Response:', (error as FetchError).data)
  }
}
```
