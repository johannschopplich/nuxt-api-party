import type { NitroFetchOptions } from 'nitropack'

export type IgnoreCase<T extends string> = Lowercase<T> | Uppercase<T>
export type RemovePrefix<T extends string, P extends string> = T extends `${P}${infer S}` ? S : never

export type PathItemObject = { [M in HttpMethod]?: any } & { parameters?: any }

// Constant types
export type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace'
export type OkStatus = 200 | 201 | 202 | 203 | 204 | 206 | 207 | '2XX' | 'default'
export type ErrorStatus = 500 | '5XX' | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 429 | 431 | 444 | 450 | 451 | 497 | 498 | 499 | '4XX'

// General purpose types
export type RequestBody<T> = T extends { requestBody: { content: infer Body } }
  ?
    | (Body extends { 'application/octet-stream': any }
      ? {
          body: string | Blob
          headers: { 'content-type': 'application/octet-stream' }
        }
      : Record<string, any>)
    | (Body extends { 'application/json': infer Schema }
      ? { body: Schema; headers?: { 'content-type'?: 'application/json' } }
      : Record<string, any>)
    | (Body extends { 'application/x-www-form-urlencoded': any }
      ? {
          body: FormData
          headers: { 'content-type': 'application/x-www-form-urlencoded' }
        }
      : Record<string, any>)
  : unknown

export type Method<M extends IgnoreCase<HttpMethod>> =
  'get' extends Lowercase<M> ? { method?: M } : { method: M }

export type Param<T, N extends string, K extends string = N> = T extends {
  parameters: { [_ in N]?: any }
}
  ? { [_ in keyof Pick<T['parameters'], N> as K]: T['parameters'][N] }
  : unknown

export type QueryParameters<T> = Param<T, 'query'>
export type HeaderParameters<T> = Param<T, 'header', 'headers'>
export type PathParameters<T> = Param<T, 'path', 'pathParams'>

export type APIRequestOptions<
  P extends PathItemObject,
  M extends IgnoreCase<keyof P & HttpMethod>,
> = Omit<
  NitroFetchOptions<any, Lowercase<M>>,
  'params' | 'query' | 'headers' | 'body' | 'method'
> & RequestBody<P[Lowercase<M>]> & PathParameters<P[Lowercase<M>]> & QueryParameters<P[Lowercase<M>]> & Method<M>

type MediaTypes<T, Status extends keyof any> = {
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

// Fetch types
export type APIResponse<T> = MediaTypes<T, OkStatus>
export type APIError<T> = MediaTypes<T, ErrorStatus>

export type AllPaths<Paths extends Record<string, PathItemObject>> =
  RemovePrefix<keyof Paths & string, '/'>
export type GETPlainPaths<Paths extends Record<string, PathItemObject>> = {
  [P in keyof Paths]: Paths[P] extends { get: { parameters: infer P } }
    ? P extends { query: any } | { header: any } | { path: any }
      ? never
      : RemovePrefix<P & string, '/'>
    : never;
}[keyof Paths]
