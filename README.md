[![Nuxt API Party module](./docs/public/og.jpg)](https://nuxt-api-party.byjohann.dev)

# Nuxt API Party

Auto-generated composables for any API in [Nuxt](https://nuxt.com), typed from OpenAPI, with your credentials kept on the server.

- [✨ &nbsp;Release Notes](https://github.com/johannschopplich/nuxt-api-party/releases)
- [📖 &nbsp;Read the documentation](https://nuxt-api-party.byjohann.dev)

## Features

- 🪅 [Auto-generated composables](https://nuxt-api-party.byjohann.dev/api/#generated-composables) for each API
- 🔒 API credentials kept on the server by a server proxy
- 🌐 No CORS issues
- 🍱 Built on Nuxt's [`useFetch`](https://nuxt.com/docs/api/composables/use-fetch) and `$fetch`
- 🧇 [Connect all your APIs](https://nuxt-api-party.byjohann.dev/essentials/getting-started#configure-your-first-endpoint)
- 🦾 Fully typed API clients from [OpenAPI documents](https://nuxt-api-party.byjohann.dev/guides/openapi-integration), with nothing else to install
- 🗃 Cached responses and hydration

## Setup

```bash
npx nuxt module add api-party
```

## Basic Usage

Add Nuxt API Party to your Nuxt configuration and describe your first API under the `apiParty` module option:

```ts
// `nuxt.config.ts`
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    endpoints: {
      jsonPlaceholder: {
        url: process.env.JSON_PLACEHOLDER_API_BASE_URL!,
        // Sent as a bearer token with each request, from the server
        token: process.env.JSON_PLACEHOLDER_API_TOKEN
      }
    }
  }
})
```

For an endpoint `jsonPlaceholder`, the module generates:

- `$jsonPlaceholder` – Returns the response data, similar to [`$fetch`](https://nuxt.com/docs/api/utils/dollarfetch)
- `useJsonPlaceholderData` – Returns [multiple values](https://nuxt-api-party.byjohann.dev/api/use-fetch-like#return-values) similar to [`useFetch`](https://nuxt.com/docs/api/composables/use-fetch)

Use these composables in your templates or components:

```vue
<script setup lang="ts">
const { data, refresh, error, status, clear } = await useJsonPlaceholderData<{ title: string }>('posts/1')
</script>

<template>
  <h1>{{ data?.title }}</h1>
  <pre>{{ JSON.stringify(data, undefined, 2) }}</pre>
</template>
```

Connect as many APIs as you need: each entry in `endpoints` gets its own pair of composables.

The [documentation](https://nuxt-api-party.byjohann.dev) covers the OpenAPI integration, caching, credential forwarding and every module option. Coming from v4? See the [migration guide](https://nuxt-api-party.byjohann.dev/advanced/migration#v5-0-0).

## 💻 Development

1. Clone this repository
2. Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
3. Install dependencies using `pnpm install`
4. Run `pnpm run dev:prepare`
5. Start development server using `pnpm run dev`

## Credits

- [Dennis Baum](https://github.com/dennisbaum) for sponsoring the initial version of this package.
- [Konkon](https://konkon.zip) for his logo pixel art.

## License

[MIT](./LICENSE) License © 2022-PRESENT [Johann Schopplich](https://github.com/johannschopplich) and © 2025-PRESENT [Matthew Messinger](https://github.com/mattmess1221)
