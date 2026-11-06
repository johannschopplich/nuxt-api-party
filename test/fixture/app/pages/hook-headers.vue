<script setup lang="ts">
import { $testApi, useTestResult } from '#imports'

const received = await $testApi<Record<string, string>>('echo-headers', {
  onRequest: ({ options }) => {
    options.headers.set('x-interceptor', 'interceptor')
  },
})

useTestResult({
  interceptorHeader: received['x-interceptor'],
  hookHeader: received['x-request-hook'],
  requestHookEndpointId: received['x-app-endpoint-id'],
  responseHookEndpointId: received['x-app-response-endpoint-id'],
})
</script>
