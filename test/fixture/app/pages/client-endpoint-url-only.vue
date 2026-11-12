<script setup lang="ts">
import { $urlOnlyClientApi, useTestResult, useUrlOnlyClientApiData } from '#imports'

const todos = await $urlOnlyClientApi<unknown[]>('todos')
const { data } = await useUrlOnlyClientApiData<unknown[]>('todos')

useTestResult({
  requestTodoCount: todos.length,
  dataTodoCount: data.value?.length,
})
</script>
