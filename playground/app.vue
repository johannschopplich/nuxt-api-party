<script setup lang="ts">
import { useServerHead } from '#imports'

useServerHead({
  title: 'Nuxt API Party',
  link: [
    { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@exampledev/new.css@1.1.2/new.min.css' },
  ],
})
</script>

<template>
  <header>
    <NuxtLink to="/">
      <h1>Nuxt API Party</h1>
    </NuxtLink>
    <p>
      Requests are proxied by a Nuxt server route and passed back to the client.
      The playground uses <a href="https://jsonplaceholder.typicode.com/">JSON Placeholder</a>
      and <a href="https://petstore3.swagger.io/">Swagger Pet Store</a> as example APIs.
      The generated composables <code>$jsonPlaceholder</code> and <code>useJsonPlaceholderData</code>
      are generated by the module.
    </p>
  </header>

  <main>
    <NuxtPage />
  </main>
</template>
