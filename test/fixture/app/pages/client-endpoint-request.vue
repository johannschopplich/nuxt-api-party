<script setup lang="ts">
import { $clientApi, useTestResult } from '#imports'

const received = await $clientApi<Record<string, string>>('echo-headers', {
  headers: { 'x-trace-id': 'abc' },
})

const receivedQuery = await $clientApi<Record<string, string>>('echo-query')

useTestResult({
  tenant: receivedQuery.tenant,
  cookie: received.cookie,
  authorization: received.authorization,
  traceId: received['x-trace-id'],
})
</script>
