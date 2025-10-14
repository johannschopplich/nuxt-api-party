# OpenAPI Types

Nuxt API Party can integrate with an [OpenAPI schema](https://swagger.io/resources/open-api/) to provide full type safety for your API requests. The generated types include:

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

## OpenAPI Type Helpers

::: tip Type Declarations
For more details and examples, see the [OpenAPI Type Helpers](/api/openapi-types) documentation.
:::

Instead of writing types manually for each API endpoint, you can extract them directly from your OpenAPI schema. This approach ensures your types are always synchronized with your API specification and reduces the risk of type mismatches:

```ts
// ❌ Manual type definition (error-prone, out of sync)
interface CreateUserRequest {
  name: string
  email: string
}

// ✅ Extract from OpenAPI schema (always up-to-date)
type CreateUserRequest = PetStore<'/user', 'post'>['request']
```

Nuxt API Party generates a powerful [unified type interface](/api/openapi-types) for each service that provides comprehensive access to all endpoint information. This interface follows the pattern `Service<Path, Method>` and serves as your single source of truth for API type information:

```ts
import type { PetStore } from '#nuxt-api-party'

// The unified interface: Service<Path, Method>
type UserEndpoint = PetStore<'/user/{username}', 'get'>

// Extract any part of the endpoint
type PathParams = UserEndpoint['path'] // { username: string }
type QueryParams = UserEndpoint['query'] // Query parameters
type RequestBody = UserEndpoint['request'] // Request body type
type Response = UserEndpoint['response'] // Success response (200)
type ErrorResponse = UserEndpoint['responses'][404] // Specific status code
```

Follow the [OpenAPI Type Helpers](/api/openapi-types) documentation for more details and practical examples of using these types in your application.
