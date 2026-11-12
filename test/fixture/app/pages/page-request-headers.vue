<script setup lang="ts">
import { $credentialsApi, useTestResult } from '#imports'

const received = await $credentialsApi<Record<string, string>>('echo-headers')

const receivedWithCallHeader = await $credentialsApi<Record<string, string>>('echo-headers', {
  headers: { 'accept-language': 'fr' },
})

useTestResult({
  cookie: received.cookie,
  authorization: received.authorization,
  userAgent: received['user-agent'],
  acceptLanguage: received['accept-language'],
  forwardedFor: received['x-forwarded-for'],
  ifNoneMatch: received['if-none-match'],
  ifModifiedSince: received['if-modified-since'],
  secFetchDest: received['sec-fetch-dest'],
  pageTag: received['x-page-tag'],
  callAcceptLanguage: receivedWithCallHeader['accept-language'],
})
</script>
