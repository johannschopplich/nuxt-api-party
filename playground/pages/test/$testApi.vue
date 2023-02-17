<script setup lang="ts">
const data = await $testApi('todos')

useTestResult(data)
</script>
