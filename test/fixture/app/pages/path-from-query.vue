<script setup lang="ts">
import { $credentialsApi, useRoute, useTestResult } from '#imports'

const statusCode = await $credentialsApi(String(useRoute().query.path))
  .then(() => 200, (error: { statusCode?: number }) => error.statusCode)

useTestResult({ statusCode })
</script>
