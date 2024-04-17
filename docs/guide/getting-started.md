# Getting Started

This guide will walk you through the steps to get started with Nuxt API Party.

## Step 1: Install Nuxt API Party

```bash
npx nuxi@latest module add api-party
```

## Step 2: Use the `nuxt-api-party` Module

Add `nuxt-api-party` to your Nuxt configuration:

```ts
// `nuxt.config.ts`
export default defineNuxtConfig({
  modules: ['nuxt-api-party']
})
```

## Step 3: Set up API Endpoints

Prepare your first API connection by setting an endpoint object. Each key represents an endpoint ID, which is used to generate the composables. The value is an object with the following properties:

- `url`: The URL of the API endpoint
- `token`: The API token to use for the endpoint (optional)
- `query`: Query parameters to send with each request (optional)
- `headers`: Headers to send with each request (optional)

```ts
// `nuxt.config.ts`
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    endpoints: {
      jsonPlaceholder: {
        url: process.env.JSON_PLACEHOLDER_API_BASE_URL!,
        // Global headers sent with each request
        headers: {
          Authorization: `Bearer ${process.env.JSON_PLACEHOLDER_API_TOKEN!}`
        }
      }
    }
  }
})
```

For the API endpoint `jsonPlaceholder` above, the following composables are generated:

- `$jsonPlaceholder` – Returns the response data, similar to [`$fetch`](https://nuxt.com/docs/api/utils/dollarfetch#fetch)
- `useJsonPlaceholderData` – Returns [multiple values](/api/use-fetch-like.html#return-values) similar to [`useFetch`](https://nuxt.com/docs/api/composables/use-fetch)

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

```ini
NUXT_API_PARTY_ENDPOINTS_JSON_PLACEHOLDER_URL=https://jsonplaceholder.typicode.com
NUXT_API_PARTY_ENDPOINTS_JSON_PLACEHOLDER_TOKEN=
```

## Step 4: Send Requests

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

## Step 5: Your Turn

Create something awesome! I'm eager to find out what you have built. [Drop me a line](mailto:mail@johannschopplich.com), if you want.
