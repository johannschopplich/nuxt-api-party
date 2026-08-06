# OpenAPI Integration

Nuxt API Party integrates with an [OpenAPI schema](https://swagger.io/resources/open-api/) to provide full type safety for your API requests. Generated types include:

- Request path with path parameters
- Query parameters
- Headers
- Request body
- Response body
- Error responses

::: info Mandatory Dependency
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

## Configuring the Schema

Add the `schema` property to your endpoint config. Set it to a file path or URL of the OpenAPI schema, or an async function returning the parsed OpenAPI schema. The file can be JSON or YAML format.

The following schema is used for code examples on this page:

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
          required: true
          schema:
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
      properties:
        id:
          type: number
        bar:
          type: string
      required:
        - bar
```

:::

Reference the schema file in your endpoint configuration:

::: code-group
```ts [nuxt.config.ts]
export default defineNuxtConfig({
  apiParty: {
    myApi: {
      url: process.env.MY_API_API_BASE_URL!,
      schema: './schemas/myApi.yaml'
    }
  }
})
```
:::

::: tip
If the [`enableSchemaFileWatcher`](/essentials/module-configuration#enableschemafilewatcher) experimental option is enabled (it is by default), changes to local schema files will automatically regenerate the types. When disabled or using a remote schema, you will need to restart the Nuxt dev server to pick up changes.
:::

## Using the Types

For most use cases, no further configuration is needed. Nuxt API Party uses the generated types to infer correct types automatically when [`useFetch`-like](/api/use-fetch-like) and [`$fetch`-like](/api/dollarfetch-like) composables are used.

However, you may want to leverage type information in additional ways.

### Extract Schema Types

The exported `components` interface of the virtual module for your API contains all schema types defined in your OpenAPI schema. Use it to extract models for your API.

Using the schema above, extract the `Foo` type:

```ts
import { components } from '#nuxt-api-party/myApi'

type Foo = components['schemas']['Foo']
//   ^? { id?: number; bar: string }
```

### Use OpenAPI Defined Path Parameters

OpenAPI can define path parameters on endpoints. They're declared as `/foo/{id}`. The endpoint isn't defined as `/foo/10`, so using that as the path breaks type inference.

To work with path parameters, set an object of parameters to the `path` property. Use the declared path for type inference, and the type checker ensures you provide all required path parameters. Parameters are interpolated into the path before the request is made.

```ts
const data = await $myApi('/foo/{id}', {
  path: {
    id: 10
  }
})
```

For reactive `path` parameters, pass a ref or getter function:

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

Some routes support multiple HTTP methods. The typing chooses the type based on the `method` property. When omitted, typing defaults to `GET`.

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

## OpenAPI Type Helpers

::: tip Type Declarations
For more details and examples, see the [OpenAPI Type Helpers](/api/openapi-types) documentation.
:::

Beyond inferring the composables, the module generates one type per endpoint that carries everything an operation declares. It is named after the endpoint ID and takes a path and a method:

```ts
import type { MyApi } from '#nuxt-api-party'

type CreateFoo = MyApi<'/foo', 'post'>

type PathParams = CreateFoo['path'] // `never`, the operation declares none
type RequestBody = CreateFoo['request'] // { id?: number; bar: string }
type Response = CreateFoo['response'] // { id?: number; bar: string }
type ByStatus = CreateFoo['responses'] // { 200: { id?: number; bar: string } }
```

Extracting from the schema this way beats writing the same shape by hand, which drifts the moment the API changes.

Follow the [OpenAPI Type Helpers](/api/openapi-types) documentation for every property the type carries.
