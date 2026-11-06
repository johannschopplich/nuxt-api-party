<script setup lang="ts">
import { $directApi, useTestResult } from '#imports'

const received = await $directApi<Record<string, string>>('echo-headers', {
  headers: { 'x-trace-id': 'abc' },
})

useTestResult({
  cookie: received.cookie,
  authorization: received.authorization,
  traceId: received['x-trace-id'],
})
</script>
