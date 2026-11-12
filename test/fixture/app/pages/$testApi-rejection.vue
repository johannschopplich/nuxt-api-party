<script setup lang="ts">
import { $testApi, useTestResult } from '#imports'

// A lone surrogate makes `encodeURIComponent` throw.
const errorName = await $testApi('items/{id}', { path: { id: '\uD800' } }).catch((error: Error) => error.name)
const dotSegmentError = await $testApi('items/{id}', { path: { id: '..' } }).catch((error: Error) => error.message)

useTestResult({ errorName, dotSegmentError })
</script>
