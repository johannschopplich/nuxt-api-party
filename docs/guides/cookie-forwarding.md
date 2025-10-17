# Cookie Forwarding

Many APIs require authentication through cookies rather than headers. This is common with Single Sign-On (SSO) systems, session-based authentication, or APIs that use HTTP-only cookies for security. Nuxt API Party automatically forwards cookies from the client request to your API endpoints.

When enabled, Nuxt API Party includes all cookies from the original request when making proxy calls to your API. This ensures authentication cookies, session IDs, and other cookie-based data are properly transmitted to your backend services.

Enable cookie forwarding by setting the `cookies` option to `true` per endpoint:

::: code-group
```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    endpoints: {
      // Example: API that uses session cookies
      myApi: {
        url: process.env.MY_API_BASE_URL!,
        cookies: true
      }
    }
  }
})
```
:::

::: warning Security Consideration
Only enable cookie forwarding for trusted APIs. Cookies will be sent to the configured endpoint URL, so ensure your API endpoints are secure and properly configured.
:::
