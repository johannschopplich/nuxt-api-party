# Interceptors

Interceptors customize API request behavior at different stages of the fetch lifecycle. Use them to modify requests, handle responses, log activities, and implement cross-cutting concerns like authentication, caching, or error tracking.

Nuxt API Party leverages [`ofetch`](https://github.com/unjs/ofetch) interceptors, giving you access to the same interception capabilities across all API endpoints. Interceptors work with both `useMyApiData` and `$myApi` composables, enabling consistent behavior across your application.

## Available Interceptors

Nuxt API Party provides four interceptor hooks that correspond to different stages of the fetch lifecycle:

- **`onRequest`** – Called before the request is sent
- **`onRequestError`** – Called if the request fails to send
- **`onResponse`** – Called when a response is received (including errors)
- **`onResponseError`** – Called when the response indicates an error (`response.ok` is `false`)

## `onRequest({ request, options })`

The `onRequest` interceptor is called before the request is sent, letting you modify the request or options. Perfect for adding authentication headers, query parameters, or implementing request logging.

```ts
const { data } = await useMyApiData('posts', {
  async onRequest({ request, options }) {
    // Add dynamic authentication
    const token = await getAuthToken()

    if (token) {
      options.headers.set('Authorization', `Bearer ${token}`)
    }

    // Log the request
    console.log(`Making request to: ${request}`)
  }
})
```

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

The `onResponseError` interceptor is called when the response indicates an error (status codes 4xx, 5xx). Perfect for centralized error handling, retry logic, or user notifications.

```ts
const { data } = await useMyApiData('posts', {
  async onResponseError({ request, response, options }) {
    const errorData = await response.json().catch(() => ({}))

    // Log to error monitoring service
    console.error(`API Error ${response.status}:`, errorData)
  }
})
```
