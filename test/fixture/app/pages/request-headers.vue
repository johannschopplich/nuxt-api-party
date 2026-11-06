<script setup lang="ts">
import { $testApi, useTestResult } from '#imports'

const received = await $testApi<Record<string, string>>('echo-headers', {
  headers: new Headers({ 'x-trace-id': 'abc' }),
})

useTestResult({
  traceId: received['x-trace-id'],
})
</script>
