<script setup lang="ts">
const { data } = await useTestApiData('todos')

useTestResult(data.value)
</script>
