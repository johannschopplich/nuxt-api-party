# What is Nuxt API Party?

Nuxt API Party is a [Nuxt](https://nuxt.com) module that provides seamless integration with multiple API endpoints. It generates **type-safe composables** for each endpoint you configure, offering a familiar developer experience similar to Nuxt's `useFetch` and `$fetch` while keeping your **API credentials secure** and eliminating **CORS issues** through a server proxy.

## Types of Generated Composables

For each API endpoint you configure, Nuxt API Party generates two distinct composables:

### 1. `useFetch`-like Composables (Reactive Data Fetching)

Perfect for components that need reactive data with caching and state management:

```ts
// For endpoint `jsonPlaceholder`, generates `useJsonPlaceholderData`
const { data, refresh, error, status } = await useJsonPlaceholderData('posts/1')
```

### 2. `$fetch`-like Composables (Direct API Calls)

Ideal for programmatic use, form submissions, and one-time actions:

```ts
// For endpoint `jsonPlaceholder`, generates `$jsonPlaceholder`
const post = await $jsonPlaceholder('posts/1', {
  method: 'POST',
  body: { title: 'New Post', content: 'Hello World' }
})
```

Both methods provide **full TypeScript support**, **error handling**, and **credential protection** out of the box.

## Key Benefits

### 🔒 **Protected API Credentials**

API tokens, keys, and credentials stay secure on the server. The proxy layer ensures sensitive information never reaches the client, preventing exposure in browser dev tools or source code.

### 🌐 **No CORS Issues**

All requests go through a Nuxt server route that proxies to your APIs, eliminating cross-origin issues since data flows server-to-server, then server-to-client.

### 🚀 **Familiar Developer Experience**

Handle requests like Nuxt's native `useFetch` and `$fetch` composables. Same patterns, same options, same caching behavior – but for any API.

### 📡 **Multiple API Support**

Connect to as many APIs as you need. Each endpoint gets its own pair of composables with independent configuration for headers, authentication, and caching.

### 🔧 **OpenAPI Integration**

Provide an OpenAPI schema to get **fully typed** request bodies, query parameters, path parameters, and response data. IntelliSense guides you through every API call.

### ⚡ **Smart Caching & Hydration**

Built-in payload caching prevents duplicate requests. Server-rendered data seamlessly hydrates to the client, avoiding unnecessary re-fetching.

## Next Steps

- [Getting Started](/essentials/getting-started) – Install the module and make a first request.
- [Data Fetching Methods](/essentials/data-fetching-methods) – Choose between the two generated composables.
- [Module Configuration](/essentials/module-configuration) – Every option an endpoint accepts.
- [How It Works](/advanced/how-it-works) – What the proxy route does with a request.
