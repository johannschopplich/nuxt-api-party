# Overview

## Composables

Nuxt API Party provides two distinct composable types to return data from your APIs. All composables are [auto-imported](https://nuxt.com/docs/guide/concepts/auto-imports) and globally available within your components:

- [Async data composable](/api/use-fetch-like) – Returns multiple values similar to [`useFetch`](https://nuxt.com/docs/api/composables/use-fetch). A generated name might be `useMyApiData`.
- [Plain fetch composable](/api/dollarfetch-like) – Returns the response data, similar to [`$fetch`](https://nuxt.com/docs/api/utils/dollarfetch#fetch). A generated name might be `$myApi`.

The actual composables (and their names) are generated based on your API endpoint ID.

## Generated Composables

The composables are generated based on your API endpoint ID. For example, if you were to call your API `jsonPlaceholder`, the generated composables are:

- `$jsonPlaceholder`
- `useJsonPlaceholderData`
