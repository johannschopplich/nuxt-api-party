<script setup lang="ts">
import { $cookieApi, $testApi, useTestResult } from '#imports'

const withCookies = await $cookieApi<Record<string, string>>('echo-headers')
const withoutCookies = await $testApi<Record<string, string>>('echo-headers')

useTestResult({
  withCookies: withCookies.cookie,
  withoutCookies: withoutCookies.cookie,
})
</script>
