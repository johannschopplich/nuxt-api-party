<script setup lang="ts">
import { $testApi, useTestResult } from '#imports'

const received = await $testApi<Record<string, string>>('echo-headers', {
  headers: {
    'authorization': 'Bearer developer-token',
    'x-trace-id': 'abc',
  },
})

useTestResult({
  authorization: received.authorization,
  traceId: received['x-trace-id'],
})
</script>
