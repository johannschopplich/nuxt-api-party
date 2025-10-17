# Defaults

Set default options for Nuxt API Party [`$myApi`](/api/dollarfetch-like) composables in a Nuxt plugin. Provide the `apiParty` key with a `defaults` and/or `endpoints.[endpointId].defaults` object.

- `defaults` defines global defaults for **all endpoints**
- `endpoints.[endpointId].defaults` defines defaults for a **specific endpoint** (overrides global defaults)

The `ModulePlugin` type ensures your plugin provides correct defaults.

::: info Inheritance
The `useApiData` composables also use these defaults, as well as relevant Nuxt configuration set in [`experimental.defaults`](https://nuxt.com/docs/4.x/guide/going-further/experimental-features#defaults).
:::

### Minimal Example Plugin

::: code-group
```ts {7-9,12-14} [plugins/api-party-defaults.ts]
import type { ModulePlugin as APIPartyPlugin } from 'nuxt-api-party'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      apiParty: {
        defaults: {
          // ...
        },
        endpoints: {
          [endpointId]: {
            defaults: {
              // ...
            }
          }
        }
      }
    }
  }
}) satisfies APIPartyPlugin
```
:::
