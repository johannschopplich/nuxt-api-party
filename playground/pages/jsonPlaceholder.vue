<script setup lang="ts">
import type { JsonPlaceholderComment } from '../types'
import type { NuxtError } from '#app'

const route = useRoute()

// Intended for similar use cases as `useFetch`
const { data, pending, error } = await useJsonPlaceholderData<JsonPlaceholderComment>(
  'comments',
  {
    query: computed(() => ({
      postId: `${route.query.postId || 1}`,
    })),
    onResponse({ response }) {
      if (import.meta.client) {
        // eslint-disable-next-line no-console
        console.log(response._data)
      }
    },
  },
)

// eslint-disable-next-line no-console
watch(error, value => console.log(value))

async function incrementPostId() {
  await navigateTo({
    query: {
      postId: `${Number(route.query.postId || 1) + 1}`,
    },
  })
  // eslint-disable-next-line no-console
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
    })

    // eslint-disable-next-line no-console
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
      Status:
      <mark v-if="pending">pending</mark>
      <code v-else>fetched</code>
    </p>
    <p>
      <button @click="incrementPostId()">
        Increment Post ID
      </button>
    </p>
    <pre>{{ JSON.stringify(data, undefined, 2) }}</pre>
  </div>
</template>
