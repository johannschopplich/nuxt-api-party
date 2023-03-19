<script setup lang="ts">
import type { TestApiTodo } from '~/types'

const data = await $testApi<TestApiTodo>('todos')

useTestResult(data)
</script>
