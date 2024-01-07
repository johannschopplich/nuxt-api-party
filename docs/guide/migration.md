# Migration

## v1.0.0

Following the release of Nuxt [3.9](https://github.com/nuxt/nuxt/releases/tag/v3.9.0), type possibilities for errors returned by `useAsyncData` and `useFetch` have been significantly improved to make them more accurate in terms of what they actually contain. See the [refactor PR](https://github.com/nuxt/nuxt/pull/24396) for more information.

This change also affects the error handling for API Party composables. The error types have been updated to reflect the changes in Nuxt 3.9. As such, you may need to update your code to make use of the new type possibilities:

```ts
import type { NuxtError } from '#app'

const { data, error } = await useMyApiData('posts')

console.error(error.data as NuxtError)
```

## v0.17.0

::: tip
The breaking changes only apply, if you rely on error handling with your API composables.
:::

With this version, the API response including status code and headers will be passed to the client fetch call. As such, error properties like `statusCode` and `statusMessage` of the error object contain the response status code and message, respectively. Before v0.17.0, these properties were always returning `404` and `Not Found` respectively.

```ts
import type { FetchError } from 'ofetch'

// Will now log the actual response status code
console.error(error.statusCode)
// Will now log the actual response status message
console.error(error.statusMessage)
```

The response body is still available via the `data` property of the error object and didn't change:

```ts
import type { FetchError } from 'ofetch'

// Log your API's error response
console.error('Response body:', error.data)
```

## v0.10.0

::: tip
If you're using the `endpoints` module option, you can skip this section. Nothing has changed for you!
:::

Support for the single API endpoint has been removed to keep the module simple and focused. Migration is fairly straightforward by moving your API configuration into the `endpoints` object. The former `name` property is now the key of the endpoint object:

```diff
export default defineNuxtConfig({
  apiParty: {
-    name: 'myApi',
-    url: '<your-api-url>',
-    token: '<your-api-token>',
-    query: {},
-    headers: {},
+    endpoints: {
+      myApi: {
+        url: '<your-api-url>',
+        token: '<your-api-token>',
+        query: {},
+        headers: {},
+      }
    }
  }
})
```

If you are using the following environment variables in your project's `.env` file:

```ini
API_PARTY_BASE_URL=your-api-url
# Optionally, add a bearer token
API_PARTY_TOKEN=your-api-token
```

You can now reference them in your API configuration:

```ts
export default defineNuxtConfig({
  apiParty: {
    endpoints: {
      myApi: {
        url: process.env.API_PARTY_BASE_URL!,
        token: process.env.API_PARTY_TOKEN!
      }
    }
  }
})
```
