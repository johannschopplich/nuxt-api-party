import { useHead } from '#imports'

export function useTestResult(data: unknown) {
  useHead({
    script: [
      {
        innerHTML: JSON.stringify(data),
        type: 'text/test-result',
      },
    ],
  })
}
