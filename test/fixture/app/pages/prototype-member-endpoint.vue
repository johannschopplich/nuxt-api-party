<script setup lang="ts">
import { $valueOf, useTestResult } from '#imports'

const todos = await $valueOf<unknown[]>('todos')

useTestResult({ todoCount: todos.length })
</script>
