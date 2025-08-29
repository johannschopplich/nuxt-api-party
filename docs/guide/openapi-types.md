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

### The Unified Type Interface

Nuxt API Party generates a powerful unified type interface for each service that provides comprehensive access to all endpoint information. This interface follows the pattern `Service<Path, Method>` and serves as your single source of truth for API type information:

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

### Core Type Properties

Every endpoint type provides these essential properties that give you complete control over API interactions. These properties are automatically inferred from your OpenAPI schema:

| Property    | Description            | Example                                          |
| ----------- | ---------------------- | ------------------------------------------------ |
| `path`      | Path parameters        | `{ petId: number }`                              |
| `query`     | Query parameters       | `{ status: 'available' \| 'pending' }`           |
| `request`   | Request body type      | `{ name: string; category: Category }`           |
| `response`  | Default response (200) | `{ id: number; name: string }`                   |
| `responses` | All status responses   | `{ 200: Pet; 404: Error; 400: ValidationError }` |
| `fullPath`  | Complete path string   | `'/pet/{petId}'`                                 |
| `method`    | HTTP method            | `'get'`                                          |
| `operation` | Full OpenAPI operation | Complete operation object                        |

### Practical Examples

Here are common patterns for extracting type information from your OpenAPI schema. These examples demonstrate how to leverage the unified type interface for different use cases:

#### Basic Type Extraction

Extract individual type components for use in your application logic, form validation, or component props:

```ts
import type { PetStore } from '#nuxt-api-party'

// Extract path parameters
type PetParams = PetStore<'/pet/{petId}', 'get'>['path']
//   ^? { petId: number }

// Extract query parameters
type StatusQuery = PetStore<'/pet/findByStatus', 'get'>['query']
//   ^? { status?: "available" | "pending" | "sold" }

// Extract request body
type CreatePetBody = PetStore<'/pet', 'post'>['request']
//   ^? { id?: number; name: string; category: Category }

// Extract response type
type PetResponse = PetStore<'/pet/{petId}', 'get'>['response']
//   ^? { id?: number; name: string; status: string }
```

#### Error Handling Types

Properly type your error handling by extracting specific error response types. This ensures robust error handling with full type safety:

```ts
// Extract specific error response types
type NotFoundError = PetStore<'/pet/{petId}', 'get'>['responses'][404]
type ValidationError = PetStore<'/pet', 'post'>['responses'][400]

// All possible responses for an endpoint
type AllPetResponses = PetStore<'/pet/{petId}', 'get'>['responses']
//   ^? { 200: Pet; 404: NotFoundError; 400: ValidationError }
```

### Schema Discovery

Nuxt API Party generates helper types for exploring your API structure programmatically. These types are useful for building dynamic UI components or API documentation:

```ts
import type { PetStoreApiMethods, PetStoreApiPaths } from '#nuxt-api-party'

// Get all available paths
type AllPaths = PetStoreApiPaths
//   ^? '/pet' | '/pet/{petId}' | '/pet/findByStatus' | /* ... */

// Get all available methods for a specific path
type PetMethods = PetStoreApiMethods<'/pet'>
//   ^? 'get' | 'post' | 'put'
```

### Schema Model Types

Nuxt API Party also generates a dedicated helper for extracting OpenAPI schema models directly. This provides access to your data models without needing to reference specific endpoints:

```ts
import type { PetStoreModel } from '#nuxt-api-party'

// Extract schema models directly
type Pet = PetStoreModel<'Pet'>
//   ^? { id?: number; name: string; category: Category; photoUrls: string[]; tags?: Tag[]; status?: 'available' | 'pending' | 'sold' }

type Category = PetStoreModel<'Category'>
//   ^? { id?: number; name?: string }

type User = PetStoreModel<'User'>
//   ^? { id?: number; username?: string; firstName?: string; lastName?: string; email?: string; password?: string; phone?: string; userStatus?: number }
```

This is particularly useful when you need to work with schema models independently of specific endpoints, such as for creating reusable components, utility functions, or when building forms that work with multiple related endpoints.
