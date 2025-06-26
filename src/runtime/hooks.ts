import type { FetchHooks } from 'ofetch'

type Arrayify<T> = { [P in keyof T]-?: Extract<T[P], unknown[]> }

export function mergeFetchHooks(...hooks: FetchHooks[]): FetchHooks {
  const result: Arrayify<FetchHooks> = {
    onRequest: [],
    onResponse: [],
    onRequestError: [],
    onResponseError: [],
  }

  for (const hook of hooks) {
    maybePush(result.onRequest, hook.onRequest)
    maybePush(result.onResponse, hook.onResponse)
    maybePush(result.onRequestError, hook.onRequestError)
    maybePush(result.onResponseError, hook.onResponseError)
  }

  return result
}

function maybePush<T>(array: T[], values?: T | T[]) {
  if (values) {
    if (Array.isArray(values)) {
      array.push(...values)
    }
    else {
      array.push(values)
    }
  }
}
