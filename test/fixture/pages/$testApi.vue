<script setup lang="ts">
import type { TestApiTodo } from '~/types'
import { $testApi, useTestResult } from '#imports'

const json = await $testApi<TestApiTodo>('todos')
const blob = await $testApi<Blob>('blob')

useTestResult({
  json,
  blob,
})
</script>
