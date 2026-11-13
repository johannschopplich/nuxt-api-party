# Credential Forwarding

Some APIs authenticate the visitor rather than your app – Single Sign-On systems, session cookies, or a bearer token your app hands the visitor after login. The server proxy withholds the visitor's credentials from an endpoint by default and forwards them only for an endpoint that sets `forwardCredentials`:

::: code-group
```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    endpoints: {
      myApi: {
        url: process.env.MY_API_BASE_URL!,
        forwardCredentials: true
      }
    }
  }
})
```
:::

With it, three headers cross the proxy:

- `Cookie` – The visitor's cookies travel on to the API.
- `Authorization` – The visitor's `Authorization` header travels on to the API, unless the endpoint sets a `token`, which replaces it.
- `Set-Cookie` – The API's cookies travel back to the browser.

Without it, the API sees none of them. That includes an `Authorization` header your app sets itself in a call's `headers`, an [interceptor](/guides/interceptors) or a Nuxt [hook](/guides/hooks): the browser sends it to the proxy, so the proxy treats it as a visitor credential. Authenticate your app against the API with the endpoint's `token` or `headers` instead, or in a [Nitro hook](/guides/hooks#nitro-runtime-hooks).

::: warning Security Consideration
Enable this only for APIs you trust. Every cookie the browser sends to your app – session cookies for your app itself included – travels to the endpoint URL.
:::

## Cross-Site Requests

A page on another site could make the visitor's browser send a request to the proxy, cookies included. For an endpoint that forwards credentials, the proxy refuses a request whose `Sec-Fetch-Site` header is `cross-site` with a `403`, before it contacts the API. A request without that header passes – Safari before 16.4 and clients other than a browser send none – and so does a `same-site` request from a sibling subdomain.

A page opened from a link on another site still renders with the visitor's credentials: the request made during its SSR comes from your app, not from the other site.

## Server-Side Rendering

During SSR, a call to the endpoint carries the cookie and `Authorization` header of the page request on to the proxy, and from there to the API. A `Set-Cookie` the API answers with ends at the server render, though: Nuxt does not copy it onto the page response. A cookie the visitor has to keep, such as a fresh session after login, comes from a call made in the browser.

[Client endpoints](/guides/client-endpoints) never receive visitor credentials, which is why an endpoint cannot set both `client` and `forwardCredentials`.
