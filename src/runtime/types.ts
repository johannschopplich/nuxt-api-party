import type { NitroFetchOptions } from 'nitropack'
import type { Ref } from 'vue'

export type EndpointFetchOptions = NitroFetchOptions<string> & {
  path: string
}

export type MaybeRef<T> = T | Ref<T>
export type MaybeRefOrGetter<T> = MaybeRef<T> | (() => T)
