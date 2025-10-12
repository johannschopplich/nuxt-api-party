# How It Works

::: info tl;dr
The internal `/api/__api_party` server route serves as a proxy between your Nuxt application and your API. This keeps your API credentials safe from the client and omits CORS issues.
:::

The generated composables will initiate a POST request to the Nuxt server route `/api/__api_party`. Request details are sent in the request body as JSON, including the target API route, HTTP method, headers and body.

This internal server route then initiates the actual request to your API. The response is passed back to the client. This way, every API request is made server-side, protecting your API credentials and avoiding CORS issues.

During server-side rendering, calls to the Nuxt server route will directly call the relevant function (emulating the request), saving an additional API call.

::: tip API Response Metadata
The proxy layer will not only pass through your API's response body to the client, but also HTTP status code, HTTP status message and headers. This allows you to handle errors gracefully and access metadata like rate limit headers.
:::
