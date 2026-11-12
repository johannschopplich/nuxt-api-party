<script setup lang="ts">
import { $testApi, useTestResult } from '#imports'

const { body } = await $testApi<{ body: string }>('echo-body-on-retry', {
  method: 'POST',
  body: new URLSearchParams({ title: 'Hello' }),
  retry: 1,
  retryDelay: 0,
})

useTestResult({ body })
</script>
