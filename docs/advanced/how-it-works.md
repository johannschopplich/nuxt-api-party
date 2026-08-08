# How It Works

::: info tl;dr
An internal server route proxies between your Nuxt application and your API. This keeps your API credentials safe from the client and eliminates CORS issues.
:::

The generated composables send a POST request to `/api/__api_party/{endpointId}`, carrying the target API route, HTTP method, headers and body as JSON in the request body.

That server route makes the actual request to your API and passes the response back to the client. Every API request therefore leaves from the server, which is what protects your credentials and avoids CORS.

During server-side rendering, a call to the route invokes the handler directly instead of going over HTTP, saving a round trip.

Because that body is JSON, a `FormData` body travels base64-encoded: every file is held in memory in full and grows by a third on the wire. Reach for [`server.proxyMode: 'passthrough'`](/api/module-configuration#proxymode) when you upload files large enough for that to matter, since it forwards the bytes as they arrived and drops the base64 detour. It still reads the body in full before passing it on, so the memory a single upload costs stays with you either way.

::: tip API Response Metadata
The proxy passes through your API's response body, HTTP status code, status message and headers. Errors stay intact, and metadata such as rate limit headers reaches your app.
:::

## The Passthrough Proxy

With [`server.proxyMode`](/api/module-configuration#proxymode) set to `'passthrough'`, requests instead go to `/api/__api_party/{endpointId}/proxy/{path}` under their own HTTP method, and the path, query, headers and body are forwarded as they are.

The proxy withholds the browser's `authorization` header from your API, since it carries credentials meant for your app rather than for the upstream service. A cookie travels only for endpoints that set `cookies: true`.

::: tip
Rename the `__api_party` segment with the [`server.basePath`](/api/module-configuration#basepath) option.
:::
