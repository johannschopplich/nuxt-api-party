import { toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import type { NuxtError } from 'nuxt/app'
import type {
  ErrorResponse,
  FilterKeys,
  MediaType,
  OperationRequestBodyContent,
  ResponseObjectMap,
  SuccessResponse,
} from 'openapi-typescript-helpers'

export type FetchResponseData<T> = FilterKeys<
  SuccessResponse<ResponseObjectMap<T>>,
  MediaType
>
export type FetchResponseError<T> = NuxtError<
  FilterKeys<
    ErrorResponse<ResponseObjectMap<T>>,
    MediaType
  >
>

export type MethodOption<M, P> = 'get' extends keyof P ? { method?: M } : { method: M }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParamsOption<T> = T extends { parameters?: any, query?: any } ? T['parameters'] : unknown

export type RequestBodyOption<T> =
  OperationRequestBodyContent<T> extends never
    ? { body?: never }
    : undefined extends OperationRequestBodyContent<T>
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
