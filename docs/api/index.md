# Overview

## Composables

Nuxt API Party offers two distinct composable types to return data from your APIs. All composables are [auto-imported](https://nuxt.com/docs/guide/concepts/auto-imports) and globally available inside your components:

- [Substitute for Nuxt `useFetch`](/api/use-my-api-data) – Returns multiple values similar to [`useFetch`](https://nuxt.com/docs/api/composables/use-fetch)
- [Substitute for Nuxt `$fetch`](/api/my-api) – Returns the response data, similar to [`$fetch`](https://nuxt.com/docs/api/utils/dollarfetch#fetch)

::: info
`$myApi` and `useMyApiData` are placeholders. They are used as examples in the documentation. The actual composables are generated based on your API endpoint ID.
:::

## Generated Composables

The composables are generated based on your API endpoint ID. For example, if you were to call your API `jsonPlaceholder`, the generated composables are:

- `$jsonPlaceholder`
- `useJsonPlaceholderData`
