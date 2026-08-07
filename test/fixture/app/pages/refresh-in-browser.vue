<script setup lang="ts">
import { useTestApiData } from '#imports'

const { data, refresh } = await useTestApiData<{ hits: number }>('hit-count')
</script>

<template>
  <div>
    <button data-testid="refresh" @click="refresh()">
      Refresh
    </button>
    <output data-testid="hits">{{ data?.hits }}</output>
  </div>
</template>
