# OpenAPI Type Helpers

Nuxt API Party generates a unified type interface for each service that provides comprehensive access to all endpoint information. This interface follows the pattern `Service<Path, Method>` and serves as your single source of truth for API type information:

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

Every endpoint type provides these properties for complete control over API interactions. Properties are automatically inferred from your OpenAPI schema:

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

Common patterns for extracting type information from your OpenAPI schema:

### Basic Type Extraction

Extract individual type components for application logic, form validation, or component props:

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

Extract specific error response types for robust error handling with full type safety:

```ts
// Extract specific error response types
type NotFoundError = PetStore<'/pet/{petId}', 'get'>['responses'][404]
type ValidationError = PetStore<'/pet', 'post'>['responses'][400]

// All possible responses for an endpoint
type AllPetResponses = PetStore<'/pet/{petId}', 'get'>['responses']
//   ^? { 200: Pet; 404: NotFoundError; 400: ValidationError }
```

## Schema Discovery

Nuxt API Party generates helper types for exploring your API structure programmatically. Useful for building dynamic UI components or API documentation:

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

Nuxt API Party generates a dedicated helper for extracting OpenAPI schema models directly. This provides access to data models without referencing specific endpoints:

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

Particularly useful when working with schema models independently of specific endpoints, such as creating reusable components, utility functions, or building forms that work with multiple related endpoints.
