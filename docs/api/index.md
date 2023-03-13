# Composables

`nuxt-api-party` offers two distinct composable types to return data from your APIs. All composables are [auto-imported](https://nuxt.com/docs/guide/concepts/auto-imports) and globally available inside your components.

Customize your API's composable names with the `name` in your Nuxt config module option. Given it is set to `jsonPlaceholder`, the composables `$jsonPlaceholder` and `useJsonPlaceholderData` will be available globally.

::: info
`$apiParty` and `useApiPartyData` are placeholder names. They are used in the examples below to demonstrate the composables' return values. For each of your API endpoints, both composable types are generated based on the name of the endpoint.
:::

- [`$apiParty`](/api/api-party) – Returns the response data, similar to [`$fetch`](https://nuxt.com/docs/api/utils/dollarfetch#fetch)
- [`useApiPartyData`](/api/use-api-party-data) – Returns multiple values similar to [`useFetch`](https://nuxt.com/docs/api/composables/use-fetch)
