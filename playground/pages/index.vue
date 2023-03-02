<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { JsonPlaceholderComment } from '../types'

const postId = ref(1)

// Intended for similar use cases as `useFetch`
const { data, pending, error } = await useJsonPlaceholderData<JsonPlaceholderComment>(
  'comments',
  {
    query: computed(() => ({
      postId: `${postId.value}`,
    })),
    onResponse({ response }) {
      if (process.server)
        return
      // eslint-disable-next-line no-console
      console.log(response._data)
    },
  },
)

// eslint-disable-next-line no-console
watch(error, value => console.log(value))

function incrementPostId() {
  postId.value++
  // eslint-disable-next-line no-console
  console.log('Post ID:', postId.value)
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
  catch (e) {
    console.error('statusCode:', (e as FetchError).statusCode)
    console.error('statusMessage:', (e as FetchError).statusMessage)
    console.error('data:', (e as FetchError).data)
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
