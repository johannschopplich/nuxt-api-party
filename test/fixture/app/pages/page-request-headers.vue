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
  forwardedHost: received['x-forwarded-host'],
  forwardedProto: received['x-forwarded-proto'],
  proxyHost: received['x-proxy-host'],
  ifNoneMatch: received['if-none-match'],
  ifModifiedSince: received['if-modified-since'],
  secFetchDest: received['sec-fetch-dest'],
  pageTag: received['x-page-tag'],
  callAcceptLanguage: receivedWithCallHeader['accept-language'],
})
</script>
