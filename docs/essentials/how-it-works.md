# How It Works

::: info tl;dr
A server proxy inside your Nuxt app forwards each request to its endpoint and adds the endpoint credentials on the way. The browser only ever talks to your own origin, so the credentials stay on the server and CORS never applies.
:::

## The Server Proxy

The generated composables send every request to `/api/__api_party/{endpointId}/{path}`, under its own HTTP method and with its query string. The proxy forwards the request to `{url}/{path}` of the endpoint and streams the request body and the response body through as they are. A request body travels with `POST`, `PUT`, `PATCH` and `DELETE` requests only.

The route lives below Nitro's [`apiBaseURL`](https://nitro.build/config#apibaseurl), which defaults to `/api` – with `nitro.apiBaseURL: '/rest'`, the proxy answers at `/rest/__api_party/{endpointId}/{path}`. A non-root [`app.baseURL`](https://nuxt.com/docs/api/nuxt-config#baseurl) prefixes it as well. Match this path in the rules of a CDN, a WAF or a rate limiter in front of your app.

During server-side rendering, the call reaches the proxy inside the same process, without a network round trip. It carries the visitor's `Cookie`, `Authorization`, `Accept-Language` and `User-Agent` headers and the visitor's address, as a request from the browser would, but not the headers that belong to the page request, such as `If-None-Match` or `Sec-Fetch-Dest`.

The route itself is public, though: anyone who can reach your app can send it a request, and the proxy forwards it with the endpoint credentials. Restrict it to the routes your app calls with [`allowedRoutes`](/guides/allowed-routes).

A visitor who opens a proxy URL in the browser sees the API's response rendered on your app's origin. Where the API serves HTML or SVG that its own users control, keep those paths out of the allowed routes.

## What the Proxy Adds

On the way to the API, the proxy applies the endpoint's configuration:

- `query` – Merged into the query string. A query parameter of the request wins over one of the same name.
- `headers` – Set on the request, replacing a header of the same name the browser sent.
- `token` – Sent as `Authorization: Bearer {token}`, replacing any other `Authorization` header.
- `X-Forwarded-For` – Set to the client address of the request, taken from an incoming `X-Forwarded-For` where there is one.

## Which Headers Travel

Request headers travel on to the API, except those that describe the connection to the proxy rather than the request: `Host`, the hop-by-hop headers such as `Connection` and `Transfer-Encoding`, `Accept-Encoding` and `Expect`.

The visitor's `Cookie` and `Authorization` headers carry their credentials for your app, not for the API. The proxy forwards them only for an endpoint that sets [`forwardCredentials`](/guides/credential-forwarding), and only then passes the API's `Set-Cookie` back to the browser.

On the way back, the response keeps its status code, status message, headers and body, so errors stay intact and metadata such as rate limit headers reaches your app. `Content-Encoding` and `Content-Length` are dropped, since the body arrives decoded.

## Redirects

The proxy passes redirects back as the API sent them instead of following them. The browser follows an absolute `Location` straight to its target, such as a signed download URL. That request is cross-origin, so the target has to allow your app's origin through CORS. A relative `Location` resolves against your app rather than the API. During SSR, nothing follows a redirect, and the call receives the `3xx` response itself. Where the API redirects to a canonical path, call that path instead.

## Errors the Proxy Answers Itself

Some requests never reach the API:

| Status | Cause |
| ------ | ----- |
| `400` | The path could climb above the endpoint URL – see [Allowed Routes](/guides/allowed-routes#paths-the-proxy-refuses). |
| `403` | The route is not among the endpoint's [allowed routes](/guides/allowed-routes), or a cross-site request targets an endpoint that [forwards credentials](/guides/credential-forwarding#cross-site-requests). |
| `404` | No endpoint with this ID exists. |
| `502` | The API cannot be reached, or a hook threw an error other than an h3 error. |

A Nitro [request hook](/guides/hooks#nitro-runtime-hooks) that throws an h3 error, such as a `401`, answers with that error instead.

## Client Endpoints

An endpoint with [`client: true`](/guides/client-endpoints) skips the proxy: the browser – and the server during SSR – calls the API directly. Its URL and endpoint credentials are published to the browser for that.
