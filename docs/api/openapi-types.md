# OpenAPI Type Helpers

For each endpoint with an OpenAPI schema, Nuxt API Party generates a type carrying everything one operation declares. It is named after the endpoint ID and takes a path and a method:

```ts
import type { PetStore } from '#nuxt-api-party'

type UserEndpoint = PetStore<'/user/{username}', 'get'>

// Extract any part of the endpoint
type PathParams = UserEndpoint['path'] // { username: string }
type QueryParams = UserEndpoint['query'] // Query parameters
type RequestBody = UserEndpoint['request'] // Request body type
type Response = UserEndpoint['response'] // Success response
type ErrorResponse = UserEndpoint['responses'][404] // Specific status code
```

Both parameters are required, and both are checked against the schema. A path the endpoint doesn't declare is a compile error, and so is a method the path doesn't allow – `PetStore<'/pet', 'get'>` doesn't compile, because the Petstore declares only `post` and `put` there.

## Core Type Properties

Each property is read off the operation in your schema:

| Property    | Description                                                              | Example                                            |
| ----------- | ------------------------------------------------------------------------ | -------------------------------------------------- |
| `path`      | Path parameters                                                          | `{ petId: number }`                                |
| `query`     | Query parameters                                                         | `{ status?: 'available' \| 'pending' \| 'sold' }`  |
| `request`   | Request body, for whichever media type the operation declares            | `{ name: string, photoUrls: string[] }`            |
| `response`  | Body of the successful response, for whichever 2xx status it declares    | `{ id?: number, name: string }`                    |
| `responses` | Every status code the operation declares, mapped to the body it returns  | `{ 200: Pet, 400: undefined, 404: undefined }`     |
| `fullPath`  | Complete path string                                                     | `'/pet/{petId}'`                                   |
| `method`    | HTTP method                                                              | `'get'`                                            |
| `operation` | Full OpenAPI operation                                                   | Complete operation object                          |

Where an operation declares nothing at all for a property, the type says so rather than inventing an empty object: `path` and `query` are `never`, `request` is `undefined`, and `response` is `never` for an operation whose success carries no body.

`request` and `response` resolve through the same helpers a request resolves through, so a value annotated with `PetStore<Path, Method>['response']` is exactly what `$petStore` hands back for that call.

## Examples

### Basic Type Extraction

Pull out a single part of an operation for a form, a component prop, or a function signature:

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
//   ^? { id?: number; name: string; category?: Category; photoUrls: string[]; tags?: Tag[]; status?: 'available' | 'pending' | 'sold' }

// Extract response type
type PetResponse = PetStore<'/pet/{petId}', 'get'>['response']
//   ^? { id?: number; name: string; category?: Category; photoUrls: string[]; tags?: Tag[]; status?: 'available' | 'pending' | 'sold' }
```

A request body the schema marks optional comes back widened with `undefined`, matching what the composables accept:

```ts
type PlaceOrderBody = PetStore<'/store/order', 'post'>['request']
//   ^? Order | undefined
```

### Error Handling Types

Extract the body a particular status code carries:

```ts
// All responses the endpoint declares
type AllPetResponses = PetStore<'/pet/{petId}', 'get'>['responses']
//   ^? { 200: Pet; 400: undefined; 404: undefined }

// A single status code
type PetNotFound = PetStore<'/pet/{petId}', 'get'>['responses'][404]
//   ^? undefined
```

Only the codes the operation itself declares are available, so `PetStore<'/pet', 'post'>['responses']` offers `200` and `405` and nothing else. A status declared without a response body – which is every error in the Petstore schema – resolves to `undefined`.

This is the body a status maps to. To type the error a failed request actually throws, see [Error Handling](/guides/error-handling).

## Schema Discovery

Two further types enumerate what the schema declares, for code that walks the API rather than calling one path:

```ts
import type { PetStoreApiMethods, PetStoreApiPaths } from '#nuxt-api-party'

// Get all available paths
type AllPaths = PetStoreApiPaths
//   ^? '/pet' | '/pet/{petId}' | '/pet/findByStatus' | /* ... */

// Get all available methods for a specific path
type PetMethods = PetStoreApiMethods<'/pet'>
//   ^? 'post' | 'put'
```

Only the methods the path declares are listed. `openapi-typescript` gives every path item a key for all eight verbs and sets the unused ones aside, so reaching for `keyof` yourself would answer with the whole alphabet of HTTP.

## Schema Model Types

Models are also reachable on their own, without going through an endpoint:

```ts
import type { PetStoreModel } from '#nuxt-api-party'

// Extract schema models directly
type Pet = PetStoreModel<'Pet'>
//   ^? { id?: number; name: string; category?: Category; photoUrls: string[]; tags?: Tag[]; status?: 'available' | 'pending' | 'sold' }

type Category = PetStoreModel<'Category'>
//   ^? { id?: number; name?: string }

type User = PetStoreModel<'User'>
//   ^? { id?: number; username?: string; firstName?: string; lastName?: string; email?: string; password?: string; phone?: string; userStatus?: number }
```

Reach for this where a type belongs to your domain rather than to one request – a shared component, a form, a helper used by several endpoints.
