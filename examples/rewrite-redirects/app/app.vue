<script setup lang="ts">
const { data } = await useMyApiData<{ message: string }>('/api/willredirect', {
  headers: {
    'x-proxy-redirect': 'manual',
  },
})
</script>

<template>
  <div>
    Message: {{ data?.message }}
  </div>
</template>
