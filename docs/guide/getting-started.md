# Getting Started

This guide will walk you through the steps to get started with `nuxt-api-party`.

## Step 1: Install nuxt-api-party

Using [pnpm](https://pnpm.io):

```bash
$ pnpm add -D nuxt-api-party
```

Using npm:

```bash
$ npm i -D nuxt-api-party
```

## Step 2: Add nuxt-api-party to Nuxt

Add `nuxt-api-party` to your Nuxt config:

```ts
// `nuxt.config.ts`
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],
})
```

## Step 3: Set up the API endpoints

Prepare your first API connection by setting an endpoint object. Each key represents an endpoint ID, which is used to generate the composables. The value is an object with the following properties:

- `url`: The URL of the API endpoint
- `token`: The API token to use for the endpoint (optional)
- `query`: The query parameters to use for the endpoint (optional)
- `headers`: The headers to use for the endpoint (optional)

```ts
// `nuxt.config.ts`
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    endpoints: {
      jsonPlaceholder: {
        url: process.env.JSON_PLACEHOLDER_API_BASE_URL!,
        token: process.env.JSON_PLACEHOLDER_API_TOKEN!,
        headers: {
          'X-Foo': 'bar'
        }
      }
    }
  }
})
```

For the API endpoint `jsonPlaceholder` above, the following composables are generated:

- `$jsonPlaceholder` – Returns the response data, similar to [`$fetch`](https://nuxt.com/docs/api/utils/dollarfetch#fetch)
- `useJsonPlaceholderData` – Returns [multiple values](/api/use-api-party-data.html#return-values) similar to [`useFetch`](https://nuxt.com/docs/api/composables/use-fetch)

::: tip
Connect to as many API endpoints as you like. Each endpoint will generate two composables.
:::

### Runtime Config

Instead of the `apiParty` module option, you can also use the [runtime config](https://nuxt.com/docs/api/configuration/nuxt-config#runtimeconfig) to set your API endpoints:

```ts
// `nuxt.config.ts`
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  runtimeConfig: {
    apiParty: {
      endpoints: {
        jsonPlaceholder: {
          url: '',
          token: ''
        }
      }
    }
  }
})
```

Leveraging automatically [replaced public runtime config values](https://nuxt.com/docs/api/configuration/nuxt-config#runtimeconfig) by matching environment variables at runtime, set your desired option in your project's `.env` file:

```
NUXT_API_PARTY_ENDPOINTS_JSON_PLACEHOLDER_URL=https://jsonplaceholder.typicode.com
NUXT_API_PARTY_ENDPOINTS_JSON_PLACEHOLDER_TOKEN=
```

## Step 4: Send Queries

Use these composables in your templates or components:

```vue
<script setup lang="ts">
const { data, pending, refresh, error } = await useJsonPlaceholderData('posts/1')
</script>

<template>
  <h1>{{ data?.title }}</h1>
  <pre>{{ JSON.stringify(data, undefined, 2) }}</pre>
</template>
```

## Step. 5: Your Turn

Create something awesome! I'm eager to find out what you have built. [Drop me a line](mailto:mail@johannschopplich.com), if you want.
