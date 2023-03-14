# Migration

## v0.10.0

Support for the single API endpoint has been removed to keep the module simple and focused. Migration is fairly straightforward by moving your API configuration into the `endpoints` object:

```diff
export default defineNuxtConfig({
  apiParty: {
-   name: 'myApi',
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
+      },
    },
  }
})
```

If you previously used the following environment variables in your project's `.env` file:

```bash
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
        token: process.env.API_PARTY_TOKEN!,
      },
    },
  }
})
```
