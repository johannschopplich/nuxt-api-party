# Module Configuration

Adapt `nuxt-api-party` to your needs with the following options in your `nuxt.config.ts` file:

```ts
// `nuxt.config.ts`
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    endpoints: {
      // ... your API endpoints
    }
  }
})
```

## `apiParty.endpoints`

Main module configuration for your API endpoints. Each key represents an endpoint ID, which is used to generate the composables. The value is an object with the following properties:

- `url`: The URL of the API endpoint
- `token`: The API token to use for the endpoint (optional)
- `query`: Query parameters to send with each request (optional)
- `headers`: Headers to send with each request (optional)
- `cookies`: Whether to send cookies with each request (optional)
- `allowedUrls`: A list of allowed URLs to change the [backend URL at runtime](/guide/dynamic-backend-url) (optional)

::: info
The composables are generated based on your API endpoint ID. For example, if you were to call an endpoint `jsonPlaceholder`, the composables will be called `useJsonPlaceholderData` and `$jsonPlaceholder`.
:::

Default value: `{}`

**Type**

```ts
type ApiPartyEndpoints = Record<
  string,
  {
    url: string
    token?: string
    query?: QueryObject
    headers?: Record<string, string>
    cookies?: boolean
    allowedUrls?: string[]
  }
> | undefined
```

**Example**

```ts
export default defineNuxtConfig({
  apiParty: {
    endpoints: {
      // Will generate `$jsonPlaceholder` and `useJsonPlaceholderData`
      jsonPlaceholder: {
        url: process.env.JSON_PLACEHOLDER_API_BASE_URL!,
        token: process.env.JSON_PLACEHOLDER_API_TOKEN!
      },
      // Will generate `$cms` and `useCmsData`
      cms: {
        url: process.env.CMS_API_BASE_URL!,
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.CMS_API_USERNAME}:${process.env.CMS_API_PASSWORD}`).toString('base64')}`
        }
      }
    }
  }
})
```
