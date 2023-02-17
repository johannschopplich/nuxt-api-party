<script setup lang="ts">
const { data } = await $jsonPlaceholder('todos/1')

useTestResult(data)
</script>
