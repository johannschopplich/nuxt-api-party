<script setup lang="ts">
import type { NuxtError } from '#app'
import type { JsonPlaceholderComment } from '../types'
import { $jsonPlaceholder, computed, navigateTo, ref, useJsonPlaceholderData, useRoute, watch } from '#imports'

const route = useRoute()

const cache = ref<RequestCache>('default')

// Intended for similar use cases as `useFetch`
const { data, status, error, execute } = useJsonPlaceholderData<JsonPlaceholderComment>(
  '/comments',
  {
    query: computed(() => ({
      postId: `${route.query.postId || 1}`,
    })),
    // no-cache will check the server for a fresh response
    cache,
    onRequest() {
      // Reset cache mode to default after a manual trigger
      if (cache.value === 'reload') {
        cache.value = 'default'
      }
    },
    onResponse({ response }) {
      if (import.meta.client) {
        console.log(response._data)
      }
    },
  },
)

async function refreshComments() {
  cache.value = 'reload'
  await execute()
}

watch(error, value => console.log(value))

async function decrementPostId() {
  await navigateTo({
    query: {
      postId: `${Number(route.query.postId || 1) - 1}`,
    },
  })

  console.log('Post ID:', route.query.postId)
}

async function incrementPostId() {
  await navigateTo({
    query: {
      postId: `${Number(route.query.postId || 1) + 1}`,
    },
  })

  console.log('Post ID:', route.query.postId)
}

const formResponse = ref()

// Intended for similar use cases as `$fetch`
async function onSubmit() {
  try {
    formResponse.value = await $jsonPlaceholder('posts', {
      method: 'POST',
      body: {
        title: 'foo',
        body: 'bar',
        userId: 1,
      },
      headers: {
        'X-Foo': 'bar',
      },
    })

    console.log('formResponse:', formResponse.value)
  }
  catch (error) {
    console.error(error as NuxtError)
    // Log the API response body
    console.error('Response body:', (error as NuxtError).data)
  }
}
</script>

<template>
  <div>
    <h2>$jsonPlaceholder</h2>
    <p>Responses are <strong>not</strong> cached by default.</p>
    <blockquote>(Imagine form fields here)</blockquote>
    <p>
      <button @click="onSubmit()">
        Submit
      </button>
    </p>
    <pre v-if="formResponse">{{ JSON.stringify(formResponse, undefined, 2) }}</pre>
    <hr>

    <h2>useJsonPlaceholderData</h2>
    <p>Responses are cached by default.</p>
    <p>
      Status: <mark>{{ status }}</mark>
    </p>
    <p>
      <button @click="decrementPostId()">
        Decrement Post ID
      </button>
      Post ID: <mark>{{ route.query.postId || 1 }}</mark>

      <button @click="incrementPostId()">
        Increment Post ID
      </button>
      <button @click="refreshComments()">
        Re-fetch
      </button>
    </p>
    <pre>{{ data }}</pre>
  </div>
</template>
