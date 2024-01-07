<script setup lang="ts">
import type { NuxtError } from '#app'

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
