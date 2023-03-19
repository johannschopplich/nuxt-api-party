<script setup lang="ts">
import type { FetchError } from 'ofetch'

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
