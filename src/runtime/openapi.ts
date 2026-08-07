import type { NuxtError } from 'nuxt/app'
import type {
  ErrorResponse,
  MediaType,
  ResponseObjectMap,
} from 'openapi-typescript-helpers'
import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

// Named one by one rather than re-exported wholesale, so `apiful`'s own `FetchResponseError`
// and `OpenAPIClient` – built on `ofetch` where these are built on Nuxt – stay out.
export type {
  FetchResponseData,
  FilterMethods,
  MethodOption,
  OpenAPIEndpoint,
  OpenAPIParameters,
  OpenAPIPathMethods,
  ParamsOption,
  RequestBodyOption,
} from 'apiful/openapi/types'

/** Error a failed request rejects with, carrying the error response body the operation declares. */
export type FetchResponseError<T extends Record<PropertyKey, any>> = NuxtError<ErrorResponse<ResponseObjectMap<T>, MediaType>>

export function resolvePathParams(path: string, params?: Record<string, MaybeRefOrGetter<unknown>>) {
  if (params) {
    for (const [key, value] of Object.entries(params))
      path = path.replaceAll(`{${key}}`, encodeURIComponent(String(toValue(value))))
  }

  return path
}
