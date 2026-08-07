<script setup lang="ts">
import { useTestApiData, useTestResult } from '#imports'

const { data, refresh } = await useTestApiData<{ hits: number }>('hit-count')
const initialHits = data.value?.hits

await refresh()

useTestResult({
  initialHits,
  refreshedHits: data.value?.hits,
})
</script>
