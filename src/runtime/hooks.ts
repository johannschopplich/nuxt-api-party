import type { FetchHooks } from 'ofetch'

type Arrayify<T> = { [P in keyof T]-?: Extract<T[P], unknown[]> }

function maybePush<T>(array: T[], values: T | T[] | undefined): void {
  if (values) {
    if (Array.isArray(values)) {
      array.push(...values)
    }
    else {
      array.push(values)
    }
  }
}

export function mergeFetchHooks(...hooks: FetchHooks[]): FetchHooks {
  const result = {
    onRequest: [],
    onResponse: [],
    onRequestError: [],
    onResponseError: [],
  } as Arrayify<FetchHooks>

  hooks.forEach((hook) => {
    Object.entries(hook).forEach(([key, value]) => {
      maybePush(result[key as keyof typeof result], value)
    })
  })

  return result
}
