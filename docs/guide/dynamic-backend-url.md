# Dynamic Backend URL

If you need to change the backend URL at runtime, you can do so by using a custom header based on the endpoint name. This is useful for example when you have a multi-tenant application where each tenant has its own backend URL.

To prevent leaking sensitive data you have to specify a list of allowed backend URLs for each endpoint in the `allowedUrls` option. If the dynamic backend URL is not in the array, the request will be rejected.

```ts
// `nuxt.config.ts`
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    endpoints: {
      jsonPlaceholder: {
        url: 'https://jsonplaceholder.typicode.com',
        allowedUrls: ['https://jsonplaceholder-v2.typicode.com']
      }
    }
  }
})
```

## Example

::: info
The examples below assume that you have set up an API endpoint called `jsonPlaceholder`. In this case you can use the `Json-Placeholder-Endpoint-Url` header to change the backend URL at runtime.
:::

```ts
const { data } = await useJsonPlaceholderData(
  'comments',
  {
    headers: {
      'Json-Placeholder-Endpoint-Url': 'https://jsonplaceholder-v2.typicode.com'
    }
  }
)
```
