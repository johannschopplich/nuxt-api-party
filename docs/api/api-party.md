# `$apiParty`

::: info
`$apiParty` is a placeholder used as an example in the documentation. The composable is generated based on your API endpoint ID. For example, if you were to call an endpoint `jsonPlaceholder`, the composable will be called `$jsonPlaceholder`.
:::

Returns the raw response of the API endpoint. Intended for actions inside methods, e.g. when sending form data to the API when clicking a submit button.

## Type Declarations

```ts
function $apiParty<T = any>(
  path: string,
  opts?: ApiFetchOptions,
): Promise<T>

type ApiFetchOptions = Omit<NitroFetchOptions<string>, 'body'> & {
  body?: string | Record<string, any> | FormData | null
  /**
   * Skip the Nuxt server proxy and fetch directly from the API.
   * Requires `allowClient` to be enabled in the module options as well.
   * @default false
   */
  client?: boolean
  /**
   * Cache the response for the same request
   * @default false
   */
  cache?: boolean
}
```

## Example

::: info
The example below assume that you have set up an API endpoint called `jsonPlaceholder`:

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

To fetch data directly from your API, without the Nuxt proxy, set the option `client` to `true`:

```ts{3}
const data = await $jsonPlaceholder(
  'posts',
  { client: true }
)
```

Requires the `allowClient` option to be `true` in your `apiParty` module configuration:

```ts{9}
// `nuxt.config.ts`
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    endpoints: {
      // ...
    },
    allowClient: true
  }
})
```
