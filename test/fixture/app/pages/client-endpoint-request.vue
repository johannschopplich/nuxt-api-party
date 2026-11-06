<script setup lang="ts">
import { $clientApi, useTestResult } from '#imports'

const received = await $clientApi<Record<string, string>>('echo-headers', {
  headers: { 'x-trace-id': 'abc' },
})

useTestResult({
  cookie: received.cookie,
  authorization: received.authorization,
  traceId: received['x-trace-id'],
})
</script>
