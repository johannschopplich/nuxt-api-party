<script setup lang="ts">
import { ref } from 'vue'
import { useTestApiData } from '#imports'

const id = ref(1)
const rerunCount = ref(0)

const { data } = await useTestApiData<{ id: string }>('items/{id}', {
  path: () => ({ id: String(id.value) }),
})
const { data: dataByParameter } = await useTestApiData<{ id: string }>('items/{id}', {
  path: { id: () => String(id.value + 0 * rerunCount.value) },
})
</script>

<template>
  <div>
    <button data-testid="next-id" @click="id++">
      Next ID
    </button>
    <button data-testid="rerun" @click="rerunCount++">
      Rerun
    </button>
    <output data-testid="id">{{ data?.id }}</output>
    <output data-testid="id-by-parameter">{{ dataByParameter?.id }}</output>
  </div>
</template>
