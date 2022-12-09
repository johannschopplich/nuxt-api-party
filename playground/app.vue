<script setup lang="ts">
import type { JsonPlaceholderComment } from './types'

const postId = ref(1)

// Intended for similar use cases as `useFetch`
const { data, error } = await useJsonPlaceholderData<JsonPlaceholderComment>(
  'comments',
  {
    query: computed(() => ({
      postId: `${postId.value}`,
    })),
    onResponse({ response }) {
      // eslint-disable-next-line no-console
      console[process.server ? 'info' : 'table'](response._data)
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
    console.error(e)
  }
}
</script>

<template>
  <Head>
    <Title>nuxt-api-party</Title>
    <Link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@exampledev/new.css@1.1.2/new.min.css" />
  </Head>

  <div>
    <h1>{JSON} Placeholder</h1>
    <p>Requests are proxied by a Nuxt server route and passed back to the client.</p>
    <hr>

    <h2>
      Example <code>$jsonPlaceholder</code>
    </h2>
    <p>Responses are <strong>not</strong> cached by default.</p>
    <blockquote>(Imagine form fields here)</blockquote>
    <p>
      <button @click="onSubmit()">
        Submit
      </button>
    </p>
    <pre v-if="formResponse">{{ JSON.stringify(formResponse, undefined, 2) }}</pre>
    <hr>

    <h2>
      Example <code>useJsonPlaceholderData</code>
    </h2>
    <p>Responses are cached by default.</p>
    <p>
      <button @click="incrementPostId()">
        Increment Post ID
      </button>
    </p>
    <pre>{{ JSON.stringify(data, undefined, 2) }}</pre>
  </div>
</template>
