<script setup lang="ts">
import { $testApi, useTestResult } from '#imports'

interface EchoedBody {
  contentType?: string
  body: string
}

const formData = new FormData()
formData.append('title', 'Hello')

const multipart = await $testApi<EchoedBody>('echo-body', { method: 'POST', body: formData })
const urlEncoded = await $testApi<EchoedBody>('echo-body', {
  method: 'POST',
  body: new URLSearchParams({ title: 'Hello' }),
})
const binary = await $testApi<EchoedBody>('echo-body', {
  method: 'POST',
  body: new Blob(['Hello'], { type: 'text/markdown' }),
})

useTestResult({ multipart, urlEncoded, binary })
</script>
