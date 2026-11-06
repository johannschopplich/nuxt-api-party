import type { FetchResponseErrorData } from 'apiful/openapi'
import type { NuxtError } from 'nuxt/app'
import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

// Named one by one rather than re-exported wholesale, so `apiful`'s own `FetchResponseError`
// and `OpenAPIClient` – built on `ofetch` where these are built on Nuxt – stay out.
export type {
  FetchResponseData,
  MethodOption,
  OpenAPIEndpoint,
  OpenAPIParameters,
  OpenAPIPathMethods,
  ParamsOption,
  RequestBodyOption,
} from 'apiful/openapi'

/** Error a failed request rejects with, carrying the error response body the operation declares. */
export type FetchResponseError<Operation> = NuxtError<FetchResponseErrorData<Operation>>

/**
 * Copy of `apiful`'s unexported `PathItem`, which `OpenAPIClient` infers the methods from. Calls check
 * measurably faster against the mapped copy than against the indexed access `Paths[Path]`.
 */
export type PathItem<T> = { [K in keyof T]: T[K] }

export function resolvePathParams(path: string, params?: Record<string, MaybeRefOrGetter<unknown>>) {
  if (params) {
    for (const [key, value] of Object.entries(params))
      path = path.replaceAll(`{${key}}`, encodeURIComponent(String(toValue(value))))
  }

  return path
}
