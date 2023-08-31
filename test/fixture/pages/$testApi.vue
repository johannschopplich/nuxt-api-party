<script setup lang="ts">
import type { TestApiTodo } from '~/types'

const json = await $testApi<TestApiTodo>('todos')
const blob = await $testApi('blob')

useTestResult({
  json,
  blob,
})
</script>
