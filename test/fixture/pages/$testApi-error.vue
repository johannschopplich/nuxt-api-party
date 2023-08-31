<script setup lang="ts">
import type { FetchError } from 'ofetch'

try {
  await $testApi('foo/bar', {
    headers: {
      accept: 'application/json',
    },
  })
}
catch (error) {
  useTestResult((error as FetchError).data)
}
</script>
