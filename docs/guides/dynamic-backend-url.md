# Dynamic Backend URL

Multi-tenant applications commonly route requests to different backend URLs based on user, organization, or other context. In such scenarios, you may need to change the backend URL dynamically at runtime.

With Nuxt API Party, send a custom header `{endpointId}-Endpoint-Url` with the request to change the backend URL for that request. The `{endpointId}` is the endpoint ID defined in your `nuxt.config` file. For example, for endpoint `jsonPlaceholder`, send the `jsonPlaceholder-Endpoint-Url` header.

::: info Security Considerations
Specify allowed backend URLs for each endpoint in the `allowedUrls` option to prevent misuse. If the dynamic backend URL isn't in the list, the request is rejected.
:::

Add the `allowedUrls` option to your endpoint configuration:

::: code-group
```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    endpoints: {
      jsonPlaceholder: {
        url: 'https://jsonplaceholder.typicode.com',
        allowedUrls: ['https://v2.jsonplaceholder.typicode.com']
      }
    }
  }
})
```
:::

With this configuration, change the backend URL at runtime by sending the `jsonPlaceholder-Endpoint-Url` header to change the backend URL to `https://v2.jsonplaceholder.typicode.com`:

```ts
const { data } = await useJsonPlaceholderData(
  'comments',
  {
    headers: {
      'jsonPlaceholder-Endpoint-Url': 'https://v2.jsonplaceholder.typicode.com'
    }
  }
)
```
