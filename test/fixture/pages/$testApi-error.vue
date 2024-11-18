<script setup lang="ts">
import type { NuxtError } from '#app'
import { $testApi, useTestResult } from '#imports'

try {
  await $testApi('foo/bar', {
    headers: {
      accept: 'application/json',
    },
  })
}
catch (error) {
  useTestResult((error as NuxtError).data)
}
</script>
