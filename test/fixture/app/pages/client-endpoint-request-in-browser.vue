<script setup lang="ts">
import { $clientApi } from '#imports'
</script>

<template>
  <button data-testid="request" @click="$clientApi('todos')">
    Request
  </button>
</template>
