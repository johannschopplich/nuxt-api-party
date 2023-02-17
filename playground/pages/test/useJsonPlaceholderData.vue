<script setup lang="ts">
const { data } = await useJsonPlaceholderData('todos/1')

useTestResult(data.value)
</script>
