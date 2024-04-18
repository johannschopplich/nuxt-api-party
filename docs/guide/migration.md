# Migration

## v2.0.0

::: tip
Breaking changes are limited to using typed OpenAPI clients. If you don't require typed clients in your Nuxt application, you can skip this migration section.
:::

With Nuxt API Party v2, the OpenAPI support has been refactored to conform to the upcoming version of the `openapi-types` package (v7). This change introduces a few breaking changes to the API Party OpenAPI client:

- Dropped support for OpenAPI 2.0 (Swagger).
- Previously, you could omit the leading slash in the API path. This is no longer possible. You must now include the leading slash in the path, just like in the OpenAPI specification.
- The `pathParams` fetch option has been renamed to `path` to better align with the OpenAPI specification and allow for more flexibility in the future.

```ts
const { data } = await usePetStoreData(
  'user/{username}', // [!code --]
  '/user/{username}', // [!code ++]
  {
    pathParams: { username: 'user1' }, // [!code --]
    path: { username: 'user1' }, // [!code ++]
  }
)
```

## v1.0.0

Following the release of Nuxt [3.9](https://github.com/nuxt/nuxt/releases/tag/v3.9.0), type possibilities for errors returned by `useAsyncData` and `useFetch` have been significantly improved to make them more accurate in terms of what they actually contain. See the [refactor PR](https://github.com/nuxt/nuxt/pull/24396) for more information.

This change also affects the error handling for API Party composables. The error types have been updated to reflect the changes in Nuxt 3.9. As such, you may need to update your code to make use of the new type possibilities:

```ts
import type { NuxtError } from '#app'

// The error is now typed as `NuxtError<unknown> | null`
const { data, error } = await useMyApiData('posts')

// For dollar API calls, the error has to be typed as `NuxtError`
try {
  await $myApi('posts')
}
catch (error) {
  console.error(error as NuxtError)
}
```
