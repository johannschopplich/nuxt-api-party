<script setup lang="ts">
interface JsonPlaceholderPost {
  userId: number
  id: number
  title: string
  body: string
}

const { data, refresh } = await useJsonPlaceholderData<JsonPlaceholderPost>('posts/1')
</script>

<template>
  <div>
    <h1>{JSON} Placeholder</h1>
    <p>Requests are proxied by a Nuxt server route and passed back to the client.</p>
    <hr>
    <h2>Response</h2>
    <pre>{{ JSON.stringify(data, undefined, 2) }}</pre>
    <button @click="refresh()">
      Refresh
    </button>
  </div>
</template>
