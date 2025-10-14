# Getting Started

This guide will walk you through setting up Nuxt API Party and making your first API requests with generated, type-safe composables.

::: tip Prerequisites
Make sure you have [Nuxt 3.18+](https://nuxt.com/docs/getting-started/installation) installed in your project.
:::

## Installation

Install Nuxt API Party via the Nuxt CLI:

```bash
npx nuxt module add api-party
```

## Add to Nuxt Configuration

Add the module to your Nuxt configuration:

```ts
// `nuxt.config.ts`
export default defineNuxtConfig({
  modules: ['nuxt-api-party']
})
```

## Configure Your First API Endpoint

Configure an API endpoint in your Nuxt configuration. Each endpoint you define will generate two composables for data fetching:

```ts
// `nuxt.config.ts`
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

### Endpoint Configuration Options

Each endpoint accepts the following configuration options:

- `url` (required): Base URL of the API
- `token` (optional): Bearer token for authentication
- `query` (optional): Default query parameters to send with each request
- `headers` (optional): Default headers sent with every request
- `cookies` (optional): Whether to forward cookies in requests
- `allowedUrls` (optional): URLs allowed for [dynamic backend switching](/guides/dynamic-backend-url)
- `schema` (optional): [OpenAPI Schema](https://swagger.io/resources/open-api) schema URL or file path for [type generation](/guides/openapi-integration)

::: tip Dynamic Configuration
For dynamic headers or runtime configuration, use [runtime hooks](/guides/hooks) or [environment variables](#environment-variables).
:::

## Generated Composables

For the endpoint `jsonPlaceholder` configured above, Nuxt API Party generates two composables:

- `$jsonPlaceholder` – Direct API calls, similar to [`$fetch`](https://nuxt.com/docs/api/utils/dollarfetch)
- `useJsonPlaceholderData` – Reactive data fetching, similar to [`useFetch`](https://nuxt.com/docs/api/composables/use-fetch)

::: tip Multiple Endpoints
You can configure as many endpoints as you need. Each endpoint generates its own pair of composables based on the endpoint ID.
:::

## Environment Variables

For secure configuration, use environment variables instead of hardcoding sensitive values:

```bash
# `.env`
JSON_PLACEHOLDER_API_BASE_URL=https://jsonplaceholder.typicode.com
JSON_PLACEHOLDER_API_TOKEN=your-secret-token
```

You can also use Nuxt's [runtime config](https://nuxt.com/docs/api/nuxt-config#runtimeconfig) for automatic environment variable mapping:

```ts
// `nuxt.config.ts`
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
      {{ error.statusMessage }}
    </p>
  </div>
</template>
```

### Direct API Calls

Use the `$jsonPlaceholder` composable for programmatic requests, form submissions, and one-time actions:

```vue
<script setup lang="ts">
import type { FetchError } from 'ofetch'

const newPost = ref({
  title: '',
  body: '',
  userId: 1
})

async function createPost() {
  try {
    const post = await $jsonPlaceholder('posts', {
      method: 'POST',
      body: newPost.value
    })

    console.log('Created post:', post)
    // Handle success (show notification, redirect, etc.)
  }
  catch (error) {
    console.error('Failed to create post:', error as FetchError)
    // Handle error
  }
}
</script>

<template>
  <form @submit.prevent="createPost">
    <input v-model="newPost.title" placeholder="Post title" required>
    <textarea v-model="newPost.body" placeholder="Post content" required />
    <button type="submit">
      Create Post
    </button>
  </form>
</template>
```

## What's Next?

### Explore More Features

- [Data Fetching Methods](/essentials/data-fetching-methods) – Learn when to use `useMyApiData` vs `$myApi`
- [Module Configuration](/essentials/module-configuration) – Explore all configuration options
- [Error Handling](/guides/error-handling) – Handle API errors gracefully
- [OpenAPI Integration](/guides/openapi-integration) – Add full type safety with OpenAPI schemas

### Advanced Topics

- [Caching Strategies](/guides/caching-strategies) – Optimize performance with smart caching
- [Runtime Hooks](/guides/hooks) – Customize behavior with request/response hooks
