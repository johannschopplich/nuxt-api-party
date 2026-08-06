# Cookie Forwarding

Many APIs authenticate through cookies rather than headers – Single Sign-On systems, session-based authentication, or APIs that keep their session in an HTTP-only cookie. Nuxt API Party can forward the cookies of the incoming browser request to such an endpoint.

Cookie forwarding is off by default and enabled per endpoint:

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
Enable this only for APIs you trust. Every cookie the browser sent – session cookies for your own app included – travels to the configured endpoint URL.
:::

An `authorization` header the browser sent is never passed on, whichever proxy mode you run – it authenticates the caller against your app, not your app against the API. With the default proxy, authenticate the upstream service through the endpoint's own `token` or `headers` option, or through a `headers` option on the call itself; with [`proxyMode: 'passthrough'`](/api/module-configuration#proxymode), which forwards the request as it stands, attach it in a [request hook](/guides/hooks).
