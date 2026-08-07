<script setup lang="ts">
import { useTestApiData, useTestResult } from '#imports'

const { data: first } = await useTestApiData<{ hits: number }>('hit-count', { key: 'shared-key' })
const { data: second } = await useTestApiData<{ hits: number }>('hit-count', { key: 'shared-key' })

useTestResult({
  firstHits: first.value?.hits,
  secondHits: second.value?.hits,
})
</script>
