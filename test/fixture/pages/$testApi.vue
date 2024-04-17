<script setup lang="ts">
import { $testApi, useTestResult } from '#imports'
import type { TestApiTodo } from '~/types'

const json = await $testApi<TestApiTodo>('todos')
const blob = await $testApi<Blob>('blob')

useTestResult({
  json,
  blob,
})
</script>
