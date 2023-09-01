# How It Works

## tl;dr

The internal `/api/__api_party` server route will proxy your API request.

::: tip
The proxy layer will not only pass-through your API's response body to the response on the client, but also HTTP status code, HTTP status message and headers. This way, you can handle errors just like you would with a direct API call.
:::

## Detailed Answer

The generated composables will initiate a POST request to the Nuxt server route `/api/__api_party`, which then initiates the actual request for a given route to your API and passes the response back to the client. This proxy behavior has the benefit of keeping your API credentials safe from the client and omitting CORS issues, since data is sent from server to server.

During server-side rendering, calls to the Nuxt server route will directly call the relevant function (emulating the request), saving an additional API call.

::: tip
Responses are cached and hydrated to the client. Subsequent calls will return cached responses, saving duplicated requests.
:::
