import { toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import type { NuxtError } from 'nuxt/app'
import type {
  ErrorResponse,
  MediaType,
  OperationRequestBodyContent,
  ResponseObjectMap,
  IsOperationRequestBodyOptional,
  SuccessResponse,
} from 'openapi-typescript-helpers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FetchResponseData<T extends Record<PropertyKey, any>> = SuccessResponse<ResponseObjectMap<T>, MediaType>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FetchResponseError<T extends Record<PropertyKey, any>> = NuxtError<ErrorResponse<ResponseObjectMap<T>, MediaType>>

export type MethodOption<M, P> = 'get' extends keyof P ? { method?: M } : { method: M }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParamsOption<T> = T extends { parameters?: any, query?: any }
  ? T['parameters']
  : Record<string, unknown>

export type RequestBodyOption<T> = OperationRequestBodyContent<T> extends never
  ? { body?: never }
  : IsOperationRequestBodyOptional<T> extends true
    ? { body?: OperationRequestBodyContent<T> }
    : { body: OperationRequestBodyContent<T> }

export type FilterMethods<T> = {
  [K in keyof Omit<T, 'parameters'> as T[K] extends never | undefined
    ? never
    : K]: T[K];
}

export function resolvePathParams(path: string, params?: Record<string, MaybeRefOrGetter<unknown>>) {
  // To simplify typings, OpenAPI path parameters can be expanded here
  if (params) {
    for (const [key, value] of Object.entries(params))
      path = path.replace(`{${key}}`, encodeURIComponent(String(toValue(value))))
  }

  return path
}
