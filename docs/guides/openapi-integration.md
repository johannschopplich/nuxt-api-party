# OpenAPI Integration

Point an endpoint at its [OpenAPI](https://swagger.io/resources/open-api/) schema and the module types every request against it:

- Request path with path parameters
- Query parameters
- Headers
- Request body
- Response body
- Error responses

The types are generated at build time by [APIful](https://apiful.land), which the module depends on, so there is nothing else to install. OpenAPI 3.0 and 3.1 are supported.

## Point an Endpoint at Its Schema

Add the `schema` property to your endpoint config. It accepts:

- A file path, resolved against the root directory of your app, or a `file:` URL.
- An `http:` or `https:` URL.
- The parsed document as an object.
- An async function that resolves to the document, for a schema you have to build yourself.

A file or URL can be JSON or YAML. External `$ref`s are bundled into the document before the types are generated.

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
        required: true
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
    endpoints: {
      myApi: {
        url: process.env.MY_API_API_BASE_URL!,
        schema: './schemas/myApi.yaml'
      }
    }
  }
})
```
:::

::: tip
In development, changes to a local schema file regenerate the types right away. A remote schema is read once, so pick up changes there by restarting the Nuxt dev server. A schema that fails to load logs an error and leaves the endpoint untyped.
:::

For most use cases, no further configuration is needed. Nuxt API Party uses the generated types to infer correct types automatically when [`useFetch`-like](/api/use-fetch-like) and [`$fetch`-like](/api/dollarfetch-like) composables are used.

## Pass Path Parameters

A path in the schema can contain parameters, declared in braces: `/foo/{id}`. Passing `/foo/10` instead breaks type inference, because the schema declares no such path.

To work with path parameters, set an object of parameters to the `path` property. Use the declared path for type inference, and the type checker ensures you provide all required path parameters. Parameters are percent-encoded and interpolated into the path before the request is made. A parameter that fills a path segment with `.` or `..` fails the call, since it would resolve the request to another path.

```ts
const data = await $myApi('/foo/{id}', {
  path: {
    id: 10
  }
})
```

For reactive `path` parameters in `useMyApiData`, pass a ref or getter function. The request is sent again whenever they change:

```ts
const id = ref(10)

const { data } = await useMyApiData('/foo/{id}', {
  path: () => ({
    id: id.value
  })
})
```

::: warning
Issues will **NOT** be reported at runtime by Nuxt API Party if the wrong parameters are used. The **incomplete** path will be sent to the API **as-is**.
:::

## Call a Path With Several Methods

Some paths declare more than one method. The types follow the `method` option and default to `GET` when it is left out.

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

## Name a Type in Your Own Code

The `#nuxt-api-party/myApi` module exports two types: `paths`, with every operation, and `components`, with every schema object your document defines. The generator emits no alias per schema object, so name the ones you use yourself:

```ts
import type { components } from '#nuxt-api-party/myApi'

export type Foo = components['schemas']['Foo']
//          ^? { id?: number; bar: string }
```

The generated `MyApiModel<'Foo'>` resolves to the same type, and `MyApi<'/foo', 'post'>` carries everything one operation declares – see [OpenAPI Type Helpers](/api/openapi-types).
