<script setup lang="ts">
import { $directApi } from '#imports'
</script>

<template>
  <button data-testid="request" @click="$directApi('todos')">
    Request
  </button>
</template>
