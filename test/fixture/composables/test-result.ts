import { useHead } from '#imports'

export function useTestResult(data: unknown) {
  useHead({
    script: [
      {
        children: JSON.stringify(data),
        type: 'text/test-result',
      },
    ],
  })
}
