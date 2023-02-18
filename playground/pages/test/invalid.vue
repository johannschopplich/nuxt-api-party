<script setup lang="ts">
import type { FetchError } from 'ofetch'

try {
  await $testApi('not-found')
}
catch (error) {
  useTestResult((error as FetchError).data)
}
</script>
