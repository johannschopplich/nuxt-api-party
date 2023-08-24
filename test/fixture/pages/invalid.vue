<script setup lang="ts">
import type { FetchError } from '#nuxt-api-party'

try {
  await $testApi('not-found', {
    headers: {
      accept: 'application/json',
    },
  })
}
catch (error) {
  useTestResult((error as FetchError).data)
}
</script>
