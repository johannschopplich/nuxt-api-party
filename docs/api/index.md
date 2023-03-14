# Overview

## Composables

`nuxt-api-party` offers two distinct composable types to return data from your APIs. All composables are [auto-imported](https://nuxt.com/docs/guide/concepts/auto-imports) and globally available inside your components:

- [`$apiParty`](/api/api-party) – Returns the response data, similar to [`$fetch`](https://nuxt.com/docs/api/utils/dollarfetch#fetch)
- [`useApiPartyData`](/api/use-api-party-data) – Returns multiple values similar to [`useFetch`](https://nuxt.com/docs/api/composables/use-fetch)

::: info
`$apiParty` and `useApiPartyData` are placeholder names. They are used in the examples below to demonstrate the composables' return values. For each of your API endpoints, both composable types are generated based on the name of the endpoint.
:::

## Dynamic Composables

Based on the name of your API endpoint, the generated composables are customized. For example, if you were to call your API `jsonPlaceholder`, the generated composables are:
- `$jsonPlaceholder`
- `useJsonPlaceholderData`
