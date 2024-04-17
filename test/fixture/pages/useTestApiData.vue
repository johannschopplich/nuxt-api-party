<script setup lang="ts">
import { useTestApiData, useTestResult } from '#imports'
import type { TestApiTodo } from '~/types'

const { data } = await useTestApiData<TestApiTodo[]>(
  'todos',
  {
    transform: res => res.map(todo => ({ ...todo, isTransformed: true })),
  },
)

useTestResult(data.value)
</script>
