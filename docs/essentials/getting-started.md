# Getting Started

Nuxt API Party is a [Nuxt](https://nuxt.com) module for talking to APIs you don't control. You configure an endpoint once, and the module generates a pair of type-safe composables for it that behave like Nuxt's own `useFetch` and `$fetch` – while the credentials stay on the server and CORS never comes up, because requests travel through a server proxy in your app, unless an endpoint is a [client endpoint](/guides/client-endpoints).

## Install Nuxt API Party

Nuxt API Party requires [Nuxt](https://nuxt.com/docs/getting-started/installation) 4.4 or later. Install it via the Nuxt CLI:

```bash
npx nuxt module add api-party
```

## Configure Your First Endpoint

Configure an endpoint in your Nuxt configuration. Each endpoint generates two composables for data fetching:

::: code-group
```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    endpoints: {
      // Endpoint ID: `jsonPlaceholder`
      jsonPlaceholder: {
        url: process.env.JSON_PLACEHOLDER_API_BASE_URL!,
        // Optional: Sent as a bearer token with every request, from the server
        token: process.env.JSON_PLACEHOLDER_API_TOKEN!
      }
    }
  }
})
```
:::

`url` is the only required option. See [Module Configuration](/api/module-configuration#apiparty-endpoints) for the rest, including default headers, credential forwarding and OpenAPI schemas.

::: tip Dynamic Configuration
For dynamic headers or runtime configuration, use [runtime hooks](/guides/hooks) or [environment variables](/api/module-configuration#environment-variables).
:::

Use environment variables instead of hardcoding sensitive values:

```bash
# `.env`
JSON_PLACEHOLDER_API_BASE_URL=https://jsonplaceholder.typicode.com
JSON_PLACEHOLDER_API_TOKEN=your-secret-token
```

## Make Your First Request

For the endpoint `jsonPlaceholder` configured above, Nuxt API Party generates two composables:

- `$jsonPlaceholder` – Direct API calls, similar to [`$fetch`](https://nuxt.com/docs/api/utils/dollarfetch)
- `useJsonPlaceholderData` – Reactive data fetching, similar to [`useFetch`](https://nuxt.com/docs/api/composables/use-fetch)

Configure as many endpoints as you need; each gets its own pair, named after its endpoint ID.

Now you can use the generated composables in your components, and their [server imports](/api/server-imports) in your Nitro routes.

### Reactive Data Fetching

Use the `useJsonPlaceholderData` composable for reactive data that updates your component:

```vue
<script setup lang="ts">
interface Post {
  id: number
  title: string
  body: string
}

// Fetch a single post
const { data: post, refresh, error, status } = await useJsonPlaceholderData<Post>('posts/1')

// Fetch multiple posts with query parameters
const { data: posts } = await useJsonPlaceholderData<Post[]>('posts', {
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

It throws on a failed request rather than exposing an `error` value, so wrap it where you need to react to failure.

From here, [Error Handling](/guides/error-handling) shows what a failed request gives you, [OpenAPI Integration](/guides/openapi-integration) how to infer request and response types from a schema, and [Caching Strategies](/guides/caching-strategies) how to reuse responses from the payload or the browser's cache.
