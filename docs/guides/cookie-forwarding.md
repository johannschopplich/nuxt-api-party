# Cookie Forwarding

Many APIs require authentication through cookies rather than headers. This is common with Single Sign-On (SSO) systems, session-based authentication, or APIs that use HTTP-only cookies for security. Nuxt API Party can automatically forward cookies from the client request to your API endpoints.

When you enable cookie forwarding, Nuxt API Party will include all cookies from the original request when making proxy calls to your API. This ensures that authentication cookies, session IDs, and other cookie-based data are properly transmitted to your backend services.

Enable cookie forwarding by setting the `cookies` option to `true` per endpoint in your `nuxt.config.ts`:

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
