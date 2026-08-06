import type { NuxtError } from 'nuxt/app'
import type {
  ErrorResponse,
  GetResponseContent,
  IsOperationRequestBodyOptional,
  MediaType,
  OperationRequestBodyContent,
  ResponseObjectMap,
  SuccessResponse,
} from 'openapi-typescript-helpers'
import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

export type FetchResponseData<T extends Record<PropertyKey, any>> = SuccessResponse<ResponseObjectMap<T>, MediaType>
export type FetchResponseError<T extends Record<PropertyKey, any>> = NuxtError<ErrorResponse<ResponseObjectMap<T>, MediaType>>

export type MethodOption<M, P> = 'get' extends keyof P ? { method?: M } : { method: M }

export type ParamsOption<T> = T extends { parameters?: any, query?: any }
  ? Omit<T['parameters'], 'cookie' | 'header'> & {
    headers?: T['parameters']['header'] | HeadersInit
  }
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

/**
 * Methods the path declares. `openapi-typescript` gives a path item a key for all
 * eight verbs and sets the ones the schema leaves out to an optional `never`, so
 * `keyof` alone would answer with every verb there is.
 */
export type OpenAPIPathMethods<Paths, Path extends keyof Paths> = keyof FilterMethods<Paths[Path]>

/** Path or query parameters of an operation, or `never` where it declares none. */
export type OpenAPIParameters<Operation, Kind extends 'path' | 'query'> = Operation extends { parameters: infer Parameters }
  ? Kind extends keyof Parameters ? Exclude<Parameters[Kind], undefined> : never
  : never

/**
 * Every type one operation carries, keyed for extraction – `Service<'/pet/{petId}', 'get'>['response']`.
 * `request` and `response` reach for the same helpers `OpenAPIClient` reaches for, so
 * both report the same type; a test pins that against a call through an actual client.
 */
export interface OpenAPIEndpoint<Paths, Path extends keyof Paths, Method extends keyof Paths[Path]> {
  path: OpenAPIParameters<Paths[Path][Method], 'path'>

  query: OpenAPIParameters<Paths[Path][Method], 'query'>

  /** Request body, `undefined` where the operation declares none or declares it optional. */
  request: OperationRequestBodyContent<Paths[Path][Method]>

  /** Body of the successful response, for whichever 2xx status and media type the operation declares. */
  response: Paths[Path][Method] extends Record<PropertyKey, any>
    ? FetchResponseData<Paths[Path][Method]>
    : never

  /** Response bodies keyed by status code, `undefined` where a status carries no content. */
  responses: ResponseObjectMap<Paths[Path][Method]> extends infer Responses extends Record<string | number, any>
    ? { [Status in keyof Responses]: GetResponseContent<Responses, MediaType, Status> }
    : never

  /** Path literal including its parameter placeholders, for route builders to consume. */
  fullPath: Path

  method: Method

  /** Raw operation object, carrying metadata such as tags and security requirements. */
  operation: Paths[Path][Method]
}

export function resolvePathParams(path: string, params?: Record<string, MaybeRefOrGetter<unknown>>) {
  // To simplify typings, OpenAPI path parameters can be expanded here.
  if (params) {
    for (const [key, value] of Object.entries(params))
      path = path.replace(`{${key}}`, encodeURIComponent(String(toValue(value))))
  }

  return path
}
