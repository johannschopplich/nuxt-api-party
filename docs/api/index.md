# Overview

## Composables

`nuxt-api-party` offers two distinct composable types to return data from your APIs. All composables are [auto-imported](https://nuxt.com/docs/guide/concepts/auto-imports) and globally available inside your components:

- [`useApiPartyData`](/api/use-api-party-data) – Returns multiple values similar to [`useFetch`](https://nuxt.com/docs/api/composables/use-fetch)
- [`$apiParty`](/api/api-party) – Returns the response data, similar to [`$fetch`](https://nuxt.com/docs/api/utils/dollarfetch#fetch)

::: info
`$apiParty` and `useApiPartyData` are placeholders. They are used as examples in the documentation. The actual composables are generated based on your API endpoint ID.
:::

## Dynamic Composables

The composables are generated based on your API endpoint ID. For example, if you were to call your API `jsonPlaceholder`, the generated composables are:

- `$jsonPlaceholder`
- `useJsonPlaceholderData`
