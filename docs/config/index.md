# Module Config

Adapt `nuxt-api-party` to your needs with the following options in your `nuxt.config.ts` file:

```ts
// `nuxt.config.ts`
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],
  apiParty: {
    // ... your options
  }
})
```

## `apiParty.endpoints`

Main module configuration for your API endpoints.

This will generate multiple API composables for the given endpoint configurations.

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
          'Custom-Api-Header': 'foo',
          'Authorization': `Basic ${Buffer.from(`${process.env.CMS_API_USERNAME}:${process.env.CMS_API_PASSWORD}`).toString('base64')}`
        }
      }
    }
  }
})
```

## `apiParty.name`

::: tip
Use this option if you only have a single API endpoint.
:::

API name for your API endpoint.

Default value: `undefined`

**Type**

`string | undefined`

## `apiParty.url`

::: tip
Use this option if you only have a single API endpoint.
:::

API base URL your API endpoint.

Default value: `process.env.API_PARTY_BASE_URL`

**Type**

`string | undefined`

## `apiParty.token`

::: tip
Use this option if you only have a single API endpoint.
:::

Optional API bearer token for your API endpoint.

You can set a custom header with the `headers` module option instead.

Default value: `process.env.API_PARTY_TOKEN`

**Type**

`string | undefined`

## `apiParty.query`

::: info
Only for single API endpoint usage. Not applied if you use the `endpoints` module option.
:::

Custom query parameters sent with every API request.

Default value: `undefined`

**Type**

`Record<string, QueryValue | QueryValue[]> | undefined`

## `apiParty.headers`

::: info
Only for single API endpoint usage. Not applied if you use the `endpoints` module option.
:::

Custom headers sent with every API request. Add authorization headers if you want to use a custom authorization method.

Default value: `undefined`

**Type**

`Record<string, string> | undefined`

**Example**

```ts
export default defineNuxtConfig({
  apiParty: {
    headers: {
      'Custom-Api-Header': 'foo',
      'Authorization': `Basic ${Buffer.from('foo:bar').toString('base64')}`
    }
  }
})
```
