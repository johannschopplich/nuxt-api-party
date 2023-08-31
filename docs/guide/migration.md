# Migration

## v0.17.0

::: tip
The breaking changes only apply, if you rely on error handling with your API composables.
:::

With this version, the API response including status code and headers will be passed to the client fetch call. As such, the properties like `statusCode` and `statusMessage` of the error object contain the response status code and message, respectively. Before v0.17.0, these properties were always returning 404 and "Not Found" respectively.

The response body is still available via the `data` property of the error object:

```ts
import type { FetchError } from 'ofetch'

// Log your API's error response
console.error('Error response body:', (error as FetchError).data)
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
