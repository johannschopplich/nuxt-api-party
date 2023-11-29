import type { NitroFetchOptions } from 'nitropack'

// --------------------------
// OpenAPI Schema
// --------------------------
export type SchemaPath = { [M in HttpMethod]?: any } & { parameters?: any }

// --------------------------
// Requests
// --------------------------
type RequestMethod<M extends CaseVariants<HttpMethod>> =
  'get' extends Lowercase<M> ? { method?: M } : { method: M }

type ParameterFromSchema<T, N extends string, K extends string = N> = T extends {
  parameters: { [_ in N]?: any }
}
  ? { [_ in keyof Pick<T['parameters'], N> as K]: T['parameters'][N] }
  : unknown

export type PathParameters<T> = ParameterFromSchema<T, 'path', 'pathParams'>
export type QueryParameters<T> = ParameterFromSchema<T, 'query'>
export type HeaderParameters<T> = ParameterFromSchema<T, 'header', 'headers'>

export type RequestBody<T> = T extends { requestBody?: { content: infer Body } }
  ?
    | (Body extends { 'application/octet-stream': any }
      ? {
          body: string | Blob
          headers: { 'content-type': 'application/octet-stream' }
        }
      : Record<string, any>)
      | (Body extends { 'application/json': infer Schema }
        ? { body: Schema, headers?: { 'content-type'?: 'application/json' } }
        : Record<string, any>)
        | (Body extends { 'application/x-www-form-urlencoded': any }
          ? {
              body: FormData
              headers: { 'content-type': 'application/x-www-form-urlencoded' }
            }
          : Record<string, any>)
  : unknown

export type RequestOptions<
  P extends SchemaPath,
  M extends CaseVariants<keyof P & HttpMethod> = CaseVariants<keyof P & 'get'>,
> = Omit<
  NitroFetchOptions<any, Lowercase<M>>,
  'params' | 'query' | 'headers' | 'method' | 'body' | 'cache'
> & RequestBody<P[Lowercase<M>]> & PathParameters<P[Lowercase<M>]> & QueryParameters<P[Lowercase<M>]> & RequestMethod<M>

// --------------------------
// Responses
// --------------------------
type ResponseContentTypes<T, Status extends keyof any> = {
  [S in Status]: T extends {
    responses: {
      [_ in S]: {
        content: {
          'application/json': infer Model
        }
      };
    }
  }
    ? Model
    : never;
}[Status]

export type ApiResponse<T> = ResponseContentTypes<T, HttpSuccessStatus>
export type ApiError<T> = ResponseContentTypes<T, HttpErrorStatus>

// --------------------------
// Paths
// --------------------------
export type AllPaths<Paths> = RemovePrefix<keyof Paths & string, '/'>

/** All endpoints that don't require a `method` property */
export type GetPaths<Paths> = {
  [P in keyof Paths]: Paths[P] extends { get: any } ? RemovePrefix<P & string, '/'> : never;
}[keyof Paths]

/** All endpoints that don't require additional options */
export type GetPlainPaths<Paths> = {
  [P in keyof Paths]: Paths[P] extends { get: infer O }
    ? O extends { parameters: { query: any } | { header: any } | { path: any } }
      ? never
      : RemovePrefix<P & string, '/'>
    : never;
}[keyof Paths]

// --------------------------
// Utilities
// --------------------------
export type CaseVariants<T extends string> = Lowercase<T> | Uppercase<T>
export type RemovePrefix<
  T extends string,
  P extends string,
> = T extends `${P}${infer S}` ? S : never

// --------------------------
// HTTP status codes
// --------------------------
export type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace'
export type HttpSuccessStatus = 200 | 201 | 202 | 203 | 204 | 206 | 207 | '2XX' | 'default'
export type HttpErrorStatus = 500 | '5XX' | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 429 | 431 | 444 | 450 | 451 | 497 | 498 | 499 | '4XX'
