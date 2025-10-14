# Dynamic Backend URL

It is common for multi-tenant applications to route requests to different backend URLs based on the user, organization, or other context. In such scenarios, you may need to change the backend URL dynamically at runtime.

With Nuxt API Party, you can send a custom header `{endpointId}-Endpoint-Url` with the request to change the backend URL for that request. The `{endpointId}` is the ID of the endpoint defined in your `nuxt.config` file. For example, for an endpoint with the ID `jsonPlaceholder`, you would send the `jsonPlaceholder-Endpoint-Url` header.

::: info Security Considerations
You must specify the allowed backend URLs for each endpoint in the `allowedUrls` option to prevent misuse. If the dynamic backend URL is not in the list, the request will be rejected.
:::

Add the `allowedUrls` option to your endpoint configuration in `nuxt.config`:

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

With the above configuration, you can change the backend URL at runtime by sending the `jsonPlaceholder-Endpoint-Url` header with your request to change the backend URL to `https://v2.jsonplaceholder.typicode.com`:

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
