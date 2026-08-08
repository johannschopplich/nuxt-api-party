# Getting Started

This guide will walk you through setting up Nuxt API Party and making your first API requests with generated, type-safe composables.

::: tip Prerequisites
Make sure you have [Nuxt 4](https://nuxt.com/docs/getting-started/installation) installed in your project.
:::

## Installation

Install Nuxt API Party via the Nuxt CLI:

```bash
npx nuxt module add api-party
```

## Add to Nuxt Configuration

Add the module to your Nuxt configuration:

::: code-group
```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['nuxt-api-party']
})
```
:::

## Configure Your First API Endpoint

Configure an API endpoint in your Nuxt configuration. Each endpoint generates two composables for data fetching:

::: code-group
```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    endpoints: {
      // Endpoint ID: `jsonPlaceholder`
      jsonPlaceholder: {
        url: process.env.JSON_PLACEHOLDER_API_BASE_URL!,
        // Optional: Global headers for all requests
        headers: {
          Authorization: `Bearer ${process.env.JSON_PLACEHOLDER_API_TOKEN!}`
        }
      }
    }
  }
})
```
:::

`url` is the only required option. See [Module Configuration](/api/module-configuration#apiparty-endpoints) for the rest, including authentication, default headers and OpenAPI schemas.

::: tip Dynamic Configuration
For dynamic headers or runtime configuration, use [runtime hooks](/guides/hooks) or [environment variables](#environment-variables).
:::

## Generated Composables

For the endpoint `jsonPlaceholder` configured above, Nuxt API Party generates two composables:

- `$jsonPlaceholder` – Direct API calls, similar to [`$fetch`](https://nuxt.com/docs/api/utils/dollarfetch)
- `useJsonPlaceholderData` – Reactive data fetching, similar to [`useFetch`](https://nuxt.com/docs/api/composables/use-fetch)

Configure as many endpoints as you need; each gets its own pair, named after its endpoint ID.

## Environment Variables

Use environment variables instead of hardcoding sensitive values:

```bash
# `.env`
JSON_PLACEHOLDER_API_BASE_URL=https://jsonplaceholder.typicode.com
JSON_PLACEHOLDER_API_TOKEN=your-secret-token
```

Or use Nuxt's [runtime config](https://nuxt.com/docs/api/nuxt-config#runtimeconfig) for automatic environment variable mapping:

::: code-group
```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  runtimeConfig: {
    apiParty: {
      endpoints: {
        jsonPlaceholder: {
          url: '', // Will be populated from `NUXT_API_PARTY_ENDPOINTS_JSON_PLACEHOLDER_URL`
          token: '' // Will be populated from `NUXT_API_PARTY_ENDPOINTS_JSON_PLACEHOLDER_TOKEN`
        }
      }
    }
  }
})
```
:::

Environment variable mapping follows this pattern:

```bash
NUXT_API_PARTY_ENDPOINTS_{ENDPOINT_ID}_{OPTION}
```

## Making Your First Request

Now you can use the generated composables in your components and server routes.

### Reactive Data Fetching

Use the `useJsonPlaceholderData` composable for reactive data that updates your component:

```vue
<script setup lang="ts">
// Fetch a single post
const { data: post, refresh, error, status } = await useJsonPlaceholderData('posts/1')

// Fetch multiple posts with query parameters
const { data: posts } = await useJsonPlaceholderData('posts', {
  query: { _limit: 10 }
})
</script>

<template>
  <div>
    <!-- Single post -->
    <article v-if="post">
      <h1>{{ post.title }}</h1>
      <p>{{ post.body }}</p>
      <button @click="refresh()">
        Refresh
      </button>
    </article>

    <!-- Posts list -->
    <div v-if="posts">
      <h2>Latest Posts</h2>
      <article v-for="item in posts" :key="item.id">
        <h3>{{ item.title }}</h3>
      </article>
    </div>

    <!-- Loading & Error states -->
    <p v-if="status === 'pending'">
      Loading...
    </p>
    <p v-if="error">
      {{ error.statusText }}
    </p>
  </div>
</template>
```

### Direct API Calls

Use the `$jsonPlaceholder` composable for programmatic requests, form submissions, and one-time actions:

```ts
const post = await $jsonPlaceholder('posts', {
  method: 'POST',
  body: { title: 'Hello', body: 'World', userId: 1 }
})
```

It throws on a failed request rather than exposing an `error` value, so wrap it where you need to react to failure. [Data Fetching Methods](/essentials/data-fetching-methods) walks through a complete form.

## Next Steps

- [Data Fetching Methods](/essentials/data-fetching-methods) – Choose between `useMyApiData` and `$myApi`.
- [Module Configuration](/api/module-configuration) – Every option an endpoint accepts.
- [Error Handling](/guides/error-handling) – What a failed request gives you.
- [OpenAPI Integration](/guides/openapi-integration) – Infer request and response types from a schema.
- [Caching Strategies](/guides/caching-strategies) – Cache in memory or in the browser.
- [Runtime Hooks](/guides/hooks) – Change a request or a response as it passes through.
