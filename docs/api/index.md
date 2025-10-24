# Overview

## Composables

Nuxt API Party provides two composable types for fetching data from your APIs. All composables are [auto-imported](https://nuxt.com/docs/guide/concepts/auto-imports) and globally available:

- [Async data composable](/api/use-fetch-like) – Returns multiple values similar to [`useFetch`](https://nuxt.com/docs/api/composables/use-fetch).
  Generated name: `useMyApiData`.
- [Plain fetch composable](/api/dollarfetch-like) – Returns response data, similar to [`$fetch`](https://nuxt.com/docs/api/utils/dollarfetch#fetch).
  Generated name: `$myApi`.

Composable names are generated based on your API endpoint ID.

## Generated Composables

Composables are generated from your API endpoint ID. For example, an endpoint `jsonPlaceholder` generates:

- `$jsonPlaceholder`
- `useJsonPlaceholderData`
