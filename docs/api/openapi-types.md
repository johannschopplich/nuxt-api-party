# OpenAPI Type Helpers

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

## Core Type Properties

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

## Practical Examples

Here are common patterns for extracting type information from your OpenAPI schema. These examples demonstrate how to leverage the unified type interface for different use cases:

### Basic Type Extraction

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

### Error Handling Types

Properly type your error handling by extracting specific error response types. This ensures robust error handling with full type safety:

```ts
// Extract specific error response types
type NotFoundError = PetStore<'/pet/{petId}', 'get'>['responses'][404]
type ValidationError = PetStore<'/pet', 'post'>['responses'][400]

// All possible responses for an endpoint
type AllPetResponses = PetStore<'/pet/{petId}', 'get'>['responses']
//   ^? { 200: Pet; 404: NotFoundError; 400: ValidationError }
```

## Schema Discovery

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

## Schema Model Types

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
