<script setup lang="ts">
import type { TestApiTodo } from '~/types'
import { useTestApiData, useTestResult } from '#imports'

const { data: firstTodo } = await useTestApiData<TestApiTodo[]>('todos', {
  transform: todos => todos.slice(0, 1),
})

const { data: firstTwoTodos } = await useTestApiData<TestApiTodo[]>('todos', {
  transform: todos => todos.slice(0, 2),
})

useTestResult({
  firstTodoCount: firstTodo.value?.length,
  firstTwoTodosCount: firstTwoTodos.value?.length,
})
</script>
