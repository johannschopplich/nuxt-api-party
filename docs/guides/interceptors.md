# Interceptors

Interceptors are the [`ofetch`](https://github.com/unjs/ofetch) callbacks `onRequest`, `onResponse`, `onRequestError` and `onResponseError`, passed to a single call. They see that call's fetch lifecycle and nothing else, which makes them the place for per-request concerns – a retry for one call, a log line for one query. Both `useMyApiData` and `$myApi` accept them.

An interceptor sees the request your app sends. For an endpoint behind the [server proxy](/advanced/how-it-works), that is the request to the proxy: `request` is the path you passed, `options.baseURL` the proxy route, and the endpoint credentials are not on it yet.

To cover every request instead, reach for a [hook](/guides/hooks).

## `onRequest({ request, options })`

The `onRequest` interceptor is called before the request is sent, letting you modify the request or options. Use for headers, query parameters or request logging.

```ts
const { data } = await useMyApiData('posts', {
  async onRequest({ request, options }) {
    options.headers.set('X-Locale', await getLocale())

    // Log the request
    console.log(`Making request to: ${request}`)
  }
})
```

::: warning `Authorization` Needs Credential Forwarding
An `Authorization` header set here reaches the server proxy as a visitor credential, which the proxy forwards only for an endpoint with [`forwardCredentials`](/guides/credential-forwarding). Without it, the API answers as if the header were never set.
:::

## `onRequestError({ request, options, error })`

The `onRequestError` interceptor is called when the request fails before being sent (network issues, timeout, etc.). Useful for logging infrastructure problems or implementing fallback strategies.

```ts
const { data } = await useMyApiData('posts', {
  async onRequestError({ request, options, error }) {
    // Log network errors to monitoring service
    console.error(`Failed to send request to ${request}:`, error.message)
  }
})
```

## `onResponse({ request, options, response })`

The `onResponse` interceptor is called for all responses, including both successful and error responses. Use for response processing, caching, or analytics.

```ts
const { data } = await useMyApiData('posts', {
  async onResponse({ request, response, options }) {
    // Log response metrics
    console.log(`Response from ${request}: ${response.status} (${response.statusText})`)

    // Handle specific status codes
    if (response.status === 429) {
      console.warn('Rate limit reached, consider implementing backoff strategy')
    }
  }
})
```

## `onResponseError({ request, options, response })`

The `onResponseError` interceptor is called when the response indicates an error (status codes 4xx, 5xx). Use for centralized error handling, retry logic or user notifications.

```ts
const { data } = await useMyApiData('posts', {
  async onResponseError({ request, response, options }) {
    const errorData = await response.json().catch(() => ({}))

    // Log to error monitoring service
    console.error(`API Error ${response.status}:`, errorData)
  }
})
```
