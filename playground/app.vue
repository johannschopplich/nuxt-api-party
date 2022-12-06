<script setup lang="ts">
interface Comment {
  postId: number
  id: number
  name: string
  email: string
  body: string
}

const postId = ref(1)

const { data, refresh } = await useJsonPlaceholderData<Comment>(
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

function incrementPostId() {
  postId.value++
}
</script>

<template>
  <div>
    <h1>{JSON} Placeholder</h1>
    <p>Requests are proxied by a Nuxt server route and passed back to the client.</p>
    <hr>
    <h2>Response</h2>
    <pre>{{ JSON.stringify(data, undefined, 2) }}</pre>
    <button @click="incrementPostId()">
      Increment Post ID
    </button>
    <button @click="refresh()">
      Refresh
    </button>
  </div>
</template>
