# Cookies

Sometimes your authorization token is stored in a cookie (e.g. coming from SSO). In this case, you can set `cookies` to `true` in your endpoint configuration to send cookies with each request.

## Examples

::: info
The examples below assume that you have set up an API endpoint called `jsonPlaceholder`. The API endpoint is authorized by a cookie which is provided by an external SSO service. To pass on the cookie provided by the external SSO, you can enable `cookies` in your endpoint configuration.
:::

```ts
// `nuxt.config.ts`
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    endpoints: {
      jsonPlaceholder: {
        url: 'https://jsonplaceholder.typicode.com',
        cookies: true
      }
    }
  }
})
```
