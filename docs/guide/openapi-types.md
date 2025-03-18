# OpenAPI Types

If your API provides an [OpenAPI](https://swagger.io/resources/open-api/) schema, Nuxt API Party can use it to generate types for you. These include path names, supported HTTP methods, request body, response body, query parameters, and headers.

::: info
Usage of this feature requires [`openapi-typescript`](https://www.npmjs.com/package/openapi-typescript) to generate TypeScript definitions from your OpenAPI schema file. It is installed alongside Nuxt API Party.
:::

## Schema Generation

Based on your configured routes, some web frameworks can generate an OpenAPI schema for you. Some examples include:

- [NestJS](https://docs.nestjs.com/openapi/introduction)
- [ElysiaJS](https://elysiajs.com/patterns/openapi.html#openapi)
- [ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/tutorials/web-api-help-pages-using-swagger)
- [Spring](https://springdoc.org/)
- [Utopia](https://docs.rs/utoipa/latest/utoipa/)

If your framework doesn't directly support it, there may also be an additional library that does.

## Configuring the schema

To take advantage of these type features, add the `schema` property to your endpoint config. It should be set to a file path or URL of the OpenAPI schema or an async function returning the parsed OpenAPI schema. The file can be in either JSON or YAML format.

The following schema will be used for the code examples on this page:

::: details

```yaml
# `schemas/myApi.yaml`
openapi: 3.0.0
info:
  title: My API
  version: 0.1.0
paths:
  /foo:
    get:
      operationId: getFoos
      responses:
        200:
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Foo'
    post:
      operationId: createFoo
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Foo'
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Foo'
  /foo/{id}:
    get:
      operationId: getFoo
      parameters:
        - name: id
          in: path
          type: number
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Foo'
components:
  schemas:
    Foo:
      type: object
      items:
        id:
          type: number
        bar:
          type: string
      required:
        - bar
```

:::

Reference the schema file in your endpoint config:

```ts
// `nuxt.config.ts`
export default defineNuxtConfig({
  apiParty: {
    myApi: {
      url: process.env.MY_API_API_BASE_URL!,
      schema: './schemas/myApi.yaml'
    }
  }
})
```

## Using the Types

For most usages, no further intervention is needed. Nuxt API Party will use the types generated from this configuration to infer the correct types automatically when [`useFetch`-like](/api/use-fetch-like) and [`$fetch`-like](/api/dollarfetch-like) composables are used.

However, there may be a few things you may want to do now that you have type information.

### Extract Schema Types

The exported `components` interface of the virtual module for your API contains all the schema types defined in your OpenAPI schema. Use it to extract models for your API.

Using the schema above, you can extract the `Foo` type like so:

```ts
import { components } from '#nuxt-api-party/myApi'

type FooModel = components['schemas']['FooModel']
//   ^? { id?: number; bar: string }
```

### Extract Request and Response Types

Nuxt API Party provides helper types to extract the request and response types for a given endpoint. The helper type is named based on your endpoint name. For example, `petStre` would result in `PetStoreRequest` and `PetStoreResponse`.

```ts
import type { MyApiRequestBody, MyApiResponse } from '#nuxt-api-party/myApi'

type FooResponse = MyApiResponse<'getFoo'>
//   ^? { id?: number; bar: string }[]
```

### Use OpenAPI Defined Path Parameters

OpenAPI can define path parameters on some endpoints. They are declared as `/foo/{id}`. Unfortunately, the endpoint is not defined as `/foo/10`, so using that as the path will break type inference.

To get around this, set an object of the parameters to the property `path`. You can then use the declared path for type inference, and the type checker will ensure you provide all required path parameters. The parameters will be interpolated into the path before the request is made.

```ts
const data = await $myApi('/foo/{id}', {
  path: {
    id: 10
  }
})
```

For reactive `path` parameters, pass a ref or getter function instead of a plain object.

```ts
const id = ref(10)

const data = await $myApi('/foo/{id}', {
  path: () => ({
    id: id.value
  })
})
```

::: warning
Issues will **NOT** be reported at runtime by Nuxt API Party if the wrong parameters are used. The **incomplete** path will be sent to the backend **as-is**.
:::

### Route Method Overloading

Some routes may be overloaded with multiple HTTP methods. The typing supports this natively and chooses the type based on the `method` property. When the property is omitted, the typing is smart enough to know `GET` is the default.

In the example schema, `GET /foo` will return a `Foo[]` array, but `POST /foo` will return a `Foo` object.

```ts
const resultGet = await $myApi('/foo')
//    ^? { id?: number; bar: string }[]

const resultPost = await $myApi('/foo', {
//    ^? { id?: number; bar: string }
  method: 'POST',
  body: {
    bar: 'string'
  }
})
```
