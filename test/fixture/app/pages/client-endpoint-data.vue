<script setup lang="ts">
import { useClientApiData, useTestResult } from '#imports'

const { data } = await useClientApiData<Record<string, string>>('echo-headers', {
  headers: { 'x-trace-id': 'abc' },
})

useTestResult({
  cookie: data.value?.cookie,
  authorization: data.value?.authorization,
  traceId: data.value?.['x-trace-id'],
})
</script>
