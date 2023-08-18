# OpenAPI Types

If your API has an [OpenAPI](https://swagger.io/resources/open-api/) schema, Nuxt API Party can use it to generate types for you. These include path names, supported HTTP methods, request body, response body, query parameters, and headers.

Usage of this feature requires [`openapi-typescript`](https://www.npmjs.com/package/openapi-typescript) to be installed. This library generates TypeScript definitions from your OpenAPI schema file.

Install it before proceeding:

::: code-group

```bash [pnpm]
pnpm add -D openapi-typescript
```

```bash [yarn]
yarn add -D openapi-typescript
```

```bash [npm]
npm install -D openapi-typescript
```

:::

## Schema Generation

Some web frameworks can generate an OpenAPI schema for you based on your configured routes. Some examples include:

- [NestJS](https://docs.nestjs.com/openapi/introduction)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Django](https://www.django-rest-framework.org/api-guide/schemas/)
- [ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/tutorials/web-api-help-pages-using-swagger)
- [Spring](https://springdoc.org/)
- [Utopia](https://docs.rs/utoipa/latest/utoipa/)

If your framework doesn't directly support it, there may also be an additional library that does.

::: info
If your API or framework uses the older OpenAPI 2.0 (aka Swagger) specification, you will need to install `openapi-typescript@5`, which is the latest version that supports it.
:::

## Configuring the schema

To take advantage of these type features, add the `schema` property to your endpoint config. It should be set to a file path or URL of the OpenAPI schema or an async function returning the parsed OpenAPI schema. The file can be in either JSON or YAML format.

The following schema will be used for the code examples on this page.

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

Reference the schema file in your endpoint config:

```ts
// `nuxt.config.ts`
export default defineNuxtConfig({
  apiParty: {
    myApi: {
      url: process.env.MY_API_API_BASE_URL!,
      schema: './schemas/myApi.yaml',
    },
  },
})
```

## Using the Types

For most usages, no further intervention is needed. Nuxt API Party will use the types generated from this config to infer the correct types automatically when `$myApi` and `useMyApiData` is used.

However, there may be a few things you may want to do now that you have type information.

### Extract the Response Body Type

You can get the request and response bodies directly from the exported `components` interface of the virtual module containing the types.

Using the schema above:

```ts
import { components } from '#nuxt-api-party/myApi'

// { id?: number; foo: string }
type Foo = components['schemas']['Foo']
```

### Use OpenAPI Defined Path Parameters

OpenAPI can define path parameters on some endpoints. They are declared as `/foo/{id}`. Unfortunately, the endpoint is not defined as `/foo/10`, so using that as the path will break type inference.

To get around this, set an object of the parameters to the property `pathParams`. You can then use the declared path for type inference, and the type checker will ensure you provide all required path parameters. The parameters will be interpolated into the path before the request is made.

```ts
const data = await $myApi('foo/{id}', {
  pathParams: {
    id: 10
  }
})
```

::: warning
Issues will **NOT** be reported at runtime by Nuxt API Party if the wrong parameters are used. The **incomplete** path will be sent to the backend **AS IS**.
:::

### Route Method Overloading

Some routes may be overloaded with multiple HTTP methods. The typing supports this natively and chooses the type based on the `method` property. When the property is omitted, the typing is smart enough to know `GET` is the default.

In the example schema, `GET /foo` will return a `Foo[]` array, but `POST /foo` will return a `Foo` object.

```ts
// resolved type: `{ id?: number; bar: string }[]`
const result1 = await $myApi('foo')

// resolved type: `{ id?: number; bar: string }`
const result = await $myApi('foo', {
  method: 'POST',
  body: {
    bar: 'string'
  }
})
```
