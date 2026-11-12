# Overview

## Composables

Each endpoint yields two composables, both [auto-imported](https://nuxt.com/docs/guide/concepts/auto-imports):

- [Async data composable](/api/use-fetch-like) – Returns multiple values similar to [`useFetch`](https://nuxt.com/docs/api/composables/use-fetch).
  Generated name: `useMyApiData`.
- [Plain fetch composable](/api/dollarfetch-like) – Returns response data, similar to [`$fetch`](https://nuxt.com/docs/api/utils/dollarfetch#fetch).
  Generated name: `$myApi`.

Server code gets its own `$myApi`, which reaches the API without the server proxy. See [Server Imports](/api/server-imports).

## Generated Composables

Composable names come from the endpoint ID. An endpoint `jsonPlaceholder` generates:

- `$jsonPlaceholder`
- `useJsonPlaceholderData`

## Types

- [OpenAPI Type Helpers](/api/openapi-types) – Extract request, response and parameter types from an endpoint's schema.
