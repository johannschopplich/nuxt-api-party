import type { FetchHooks } from 'ofetch'

type Arrayify<T> = { [P in keyof T]-?: Extract<T[P], unknown[]> }
type Hooks = Arrayify<Pick<FetchHooks, 'onRequest' | 'onResponse'>>

export function mergeFetchHooks(...hooks: FetchHooks[]): Hooks {
  const result: Hooks = {
    onRequest: [],
    onResponse: [],
  }

  hooks.forEach((hook) => {
    for (const name of Object.keys(result) as (keyof Hooks)[]) {
      if (hook) {
        result[name].push(...(Array.isArray(hook) ? hook : [hook]))
      }
    }
  })

  return result
}
