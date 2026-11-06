<script setup lang="ts">
import { ref } from 'vue'
import { useTestApiData } from '#imports'

const version = ref(1)
const { data } = await useTestApiData<{ version: string }>('echo-query', {
  query: () => ({ version: version.value }),
})
</script>

<template>
  <div>
    <button data-testid="next-version" @click="version++">
      Next version
    </button>
    <output data-testid="version">{{ data?.version }}</output>
  </div>
</template>
