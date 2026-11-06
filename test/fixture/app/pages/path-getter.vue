<script setup lang="ts">
import { ref } from 'vue'
import { useTestApiData } from '#imports'

const id = ref(1)
const { data } = await useTestApiData<{ id: string }>('items/{id}', {
  path: () => ({ id: String(id.value) }),
})
</script>

<template>
  <div>
    <button data-testid="next-id" @click="id++">
      Next ID
    </button>
    <output data-testid="id">{{ data?.id }}</output>
  </div>
</template>
