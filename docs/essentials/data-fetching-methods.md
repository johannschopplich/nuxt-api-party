# Data Fetching Methods

Nuxt API Party provides two distinct approaches to fetch data from your APIs. Understanding when to use each method will help you build more efficient and maintainable applications.

::: tip
The generated composables follow the exact same patterns as Nuxt's native `useFetch` and `$fetch`. If you're familiar with Nuxt data fetching, you already know how to use Nuxt API Party!
:::

## Methods Comparison

Choose between reactive data fetching and direct API calls based on your use case:

| Feature | **`useMyApiData` Composables** | **`$myApi` Composables** |
|---------|------------------------------|-------------------------|
| **Use case** | Components, reactive data | One-time actions |
| **Return type** | [`AsyncData`](https://nuxt.com/docs/api/composables/use-async-data#return-values) interface | Direct Promise with response data |
| **Error handling** | Reactive `error` property | Try/catch with thrown errors |
| **Caching** | Automatic with deduplication | Manual with cache option |
| **Server rendering** | Automatic hydration | Manual server/client handling |
| **Best for** | Page data, reactive components | API mutations, programmatic calls |

## Method 1: Reactive Data Fetching

Use `useMyApiData` composables in your components and pages to fetch and reactively update data. These composables integrate seamlessly with Nuxt's hydration and caching systems.

```vue
<script setup lang="ts">
const postId = ref(1)

// The request automatically updates when `postId` changes
const { data } = await useJsonPlaceholderData(() => `posts/${postId.value}`, {
  watch: [postId]
})

function nextPost() {
  postId.value++
}
</script>

<template>
  <div>
    <h1>{{ data?.title }}</h1>
    <button @click="nextPost()">
      Next Post
    </button>
  </div>
</template>
```

## Method 2: Direct API Calls

Use `$myApi` composables for programmatic API interactions, form submissions, and one-time actions where you need direct control over the request timing.

A common pattern is handling form submissions:

```vue
<script setup lang="ts">
import type { FetchError } from 'ofetch'

const form = ref({
  title: '',
  body: '',
  userId: 1
})
const isSubmitting = ref(false)
const submitError = ref(null)

async function submitPost() {
  isSubmitting.value = true
  submitError.value = null

  try {
    const newPost = await $jsonPlaceholder('posts', {
      method: 'POST',
      body: form.value
    })

    console.log('Post created:', newPost)
    // Redirect or show success message
  }
  catch (error) {
    submitError.value = (error as FetchError).statusMessage || 'Failed to create post'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submitPost">
    <input v-model="form.title" placeholder="Title" required>
    <textarea v-model="form.body" placeholder="Content" required />

    <button type="submit" :disabled="isSubmitting">
      {{ isSubmitting ? 'Creating...' : 'Create Post' }}
    </button>

    <div v-if="submitError" class="error">
      {{ submitError }}
    </div>
  </form>
</template>
```

In plugins or middleware, you can also use `$myApi` for initial data fetching:

```ts
// `plugins/api-setup.ts`
export default defineNuxtPlugin(async () => {
  const settings = useState('app.settings', () => ({}))

  // Fetch app settings once and hydrate state in the client
  try {
    const data = await $jsonPlaceholder('settings')
    settings.value = data
  }
  catch (error) {
    console.error('Failed to load settings:', error)
  }
})
```

## Next Steps

- **Need API configuration?** Review [Module Configuration](/essentials/module-configuration)
- **Want type safety?** Learn about [OpenAPI Integration](/guides/openapi-integration)
