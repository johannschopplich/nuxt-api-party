# Client Endpoints

An endpoint with `client: true` sends every request straight to the API – from the browser, and from the server during SSR – and never through the server proxy:

```ts
export default defineNuxtConfig({
  apiParty: {
    endpoints: {
      publicApi: {
        url: 'https://api.example.com',
        client: true
      }
    }
  }
})
```

::: warning Endpoint Credentials Are Public
The browser has to send the endpoint credentials itself, so a client endpoint's `url`, `token`, `query` and `headers` are written into the public runtime config, readable in the delivered HTML. Reserve `client: true` for APIs whose credentials may be public, and expect the API to answer CORS requests from your origin.
:::

A client endpoint's environment variables take the `PUBLIC` prefix – see [Environment Variables](/api/module-configuration#environment-variables).

During SSR, a request to a client endpoint leaves the server without the visitor's cookie or `Authorization` header.

With `ssr: false`, there is often no server to proxy through, so every endpoint defaults to `client: true`. Two exceptions keep the server proxy: an endpoint with `client: false`, and one that sets `forwardCredentials` or `allowedRoutes`, both of which only the proxy acts on.

To send some calls of one API through the proxy and others straight to it, configure the API twice, as two endpoints.
