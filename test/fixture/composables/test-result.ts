import { useHead } from '#imports'

export function useTestResult(data: any) {
  useHead({
    script: [
      {
        children: JSON.stringify(data),
        type: 'text/test-result',
      },
    ],
  })
}
