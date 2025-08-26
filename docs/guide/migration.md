# Migration

## v3.0.0

Caching has been completely refactored in Nuxt API Party v3. If you are using caching, please read the [caching documentation](./caching) to understand the new caching system.

::: warning
Caching behavior is now controlled by the upstream endpoint. If your endpoint does not support caching, the responses will not be stored in the browser's cache. This is a breaking change from previous versions, where caching was done regardless.

The simplest way to ensure caching is enabled on the backend is to set the `Cache-Control: max-age=3600` header on your API responses, which will cache the response for 1 hour.

See the MDN documentation on [HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching) for more information on how to set up caching on your API.
:::

- Cached responses are no longer stored in the Nuxt payload data. Instead, they are stored in the browser's cache, which allows for better memory management and performance. This follows a change done in Nuxt 3.17.
- Generated `$api` and `useApiData` composables now support the `RequestInit.cache` option. For convenience, you can pass `true` for `'default'` caching, or `false` for `'no-store'` caching.
- `$api` composables now have caching enabled by default. To restore the old behavior, you can set the `cache` option to `false` or `'no-store'` in the request options.

  ```ts
  const data = $petStore('/user/{username}', {
    cache: 'no-store', // [!code ++]
  })
  ```

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
