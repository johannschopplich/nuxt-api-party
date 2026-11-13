<script setup lang="ts">
import { ref } from 'vue'
import { useTestApiData } from '#imports'

const revision = ref(0)
const { data } = await useTestApiData<{ hits: number }>('hit-count', {
  watch: [revision],
  getCachedData: (key, nuxtApp, ctx) => ctx.cause === 'initial'
    ? nuxtApp.payload.data[key]
    : undefined,
})
</script>

<template>
  <div>
    <NuxtLink data-testid="leave" to="/cached-data-elsewhere">
      Leave
    </NuxtLink>
    <button data-testid="revise" @click="revision++">
      Revise
    </button>
    <output data-testid="hits">{{ data?.hits }}</output>
  </div>
</template>
