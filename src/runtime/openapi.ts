import type { NitroFetchOptions } from 'nitropack'

export type IgnoreCase<T extends string> = Lowercase<T> | Uppercase<T>
export type RemovePrefix<T extends string, P extends string> = T extends `${P}${infer S}` ? S : never

export type PathItemObject = { [M in HttpMethod]?: any } & { parameters?: any }

// General purpose types
export type RequestBody<T> = T extends { requestBody?: { content: infer Body } }
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

export type PathParameters<T> = Param<T, 'path', 'pathParams'>
export type QueryParameters<T> = Param<T, 'query'>
export type HeaderParameters<T> = Param<T, 'header', 'headers'>

export type OpenApiRequestOptions<
  P extends PathItemObject,
  M extends IgnoreCase<keyof P & HttpMethod> = IgnoreCase<keyof P & 'get'>,
> = Omit<
  NitroFetchOptions<any, Lowercase<M>>,
  'params' | 'query' | 'headers' | 'method' | 'body' | 'cache'
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
export type OpenApiResponse<T> = MediaTypes<T, HttpSuccessStatus>
export type OpenApiError<T> = MediaTypes<T, HttpErrorStatus>

// Path types
export type AllPaths<Paths> = RemovePrefix<keyof Paths & string, '/'>

/** All endpoints that don't require a `method` property */
export type GETPaths<Paths> = {
  [P in keyof Paths]: Paths[P] extends { get: any } ? RemovePrefix<P & string, '/'> : never;
}[keyof Paths]

/** All endpoints that don't require additional options */
export type GETPlainPaths<Paths> = {
  [P in keyof Paths]: Paths[P] extends { get: infer O }
    ? O extends { parameters: { query: any } | { header: any } | { path: any } }
      ? never
      : RemovePrefix<P & string, '/'>
    : never;
}[keyof Paths]

// HTTP status codes and methods
export type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace'
export type HttpSuccessStatus = 200 | 201 | 202 | 203 | 204 | 206 | 207 | '2XX' | 'default'
export type HttpErrorStatus = 500 | '5XX' | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 429 | 431 | 444 | 450 | 451 | 497 | 498 | 499 | '4XX'
