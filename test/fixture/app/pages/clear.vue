<script setup lang="ts">
import { useTestApiData, useTestResult } from '#imports'

const { data, clear, execute } = await useTestApiData<{ hits: number }>('hit-count')

const initialHits = data.value?.hits

clear()
await execute()

useTestResult({
  initialHits,
  clearedHits: data.value?.hits,
})
</script>
