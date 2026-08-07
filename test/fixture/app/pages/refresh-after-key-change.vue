<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTestApiData, useTestResult } from '#imports'

const version = ref(1)
const { data, refresh } = await useTestApiData<{ hits: number }>('hit-count', {
  query: computed(() => ({ version: version.value })),
})

version.value = 2
await refresh()
const changedHits = data.value?.hits

await refresh()

useTestResult({
  changedHits,
  refreshedHits: data.value?.hits,
})
</script>
