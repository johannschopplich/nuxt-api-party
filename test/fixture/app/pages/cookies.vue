<script setup lang="ts">
import { $credentialsApi, $testApi, useTestResult } from '#imports'

const withCookies = await $credentialsApi<Record<string, string>>('echo-headers')
const withoutCookies = await $testApi<Record<string, string>>('echo-headers')

useTestResult({
  withCookies: withCookies.cookie,
  withoutCookies: withoutCookies.cookie,
})
</script>
