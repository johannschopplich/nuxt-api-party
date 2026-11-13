# API Reference

This reference covers the module options and everything an endpoint generates. To make a first request, start with [Getting Started](/essentials/getting-started).

## Configuration

- [Module Configuration](/api/module-configuration) – Every option an endpoint accepts.

## Generated Composables

Each endpoint yields two composables, both [auto-imported](https://nuxt.com/docs/guide/concepts/auto-imports):

- [`useFetch`-Like Composable](/api/use-fetch-like) – Returns multiple values similar to [`useFetch`](https://nuxt.com/docs/api/composables/use-fetch).
  Generated name: `useMyApiData`.
- [`$fetch`-Like Composable](/api/dollarfetch-like) – Returns response data, similar to [`$fetch`](https://nuxt.com/docs/api/utils/dollarfetch).
  Generated name: `$myApi`.

Composable names come from the endpoint ID: an endpoint `jsonPlaceholder` generates `$jsonPlaceholder` and `useJsonPlaceholderData`.

Server code gets its own `$myApi`, which reaches the API without the server proxy. See [Server Imports](/api/server-imports).

## Types

- [OpenAPI Type Helpers](/api/openapi-types) – Extract request, response and parameter types from an endpoint's schema.
