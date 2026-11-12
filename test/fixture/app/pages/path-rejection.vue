<script setup lang="ts">
import { useTestApiData, useTestResult } from '#imports'

const { error } = await useTestApiData('items/{id}', { path: { id: '..' } })

useTestResult({ errorMessage: error.value?.message })
</script>
