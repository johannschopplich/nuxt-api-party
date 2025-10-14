# Defaults

Default options for Nuxt API Party [`$myApi`](/api/dollarfetch-like) composables can be set in a Nuxt plugin. It should provide the `apiParty` key with a `defaults` and/or `endpoints.[endpointId].defaults` object.

- `defaults` defines global defaults used for **all endpoints**
- `endpoints.[endpointId].defaults` defines defaults for a **specific endpoint** (overrides global defaults)

The type `ModulePlugin` is provided as a convenience to ensure your plugin provides the correct defaults.

::: info Inheritance
The `useApiData` composables will also use these defaults, as well as the relevant Nuxt configuration set in [`experimental.defaults`](https://nuxt.com/docs/4.x/guide/going-further/experimental-features#defaults).
:::

### Minimal Example Plugin

::: code-group
```ts {7-9,12-14} [plugins/apiparty-defaults.ts]
import type { ModulePlugin as APIPartyPlugin } from 'nuxt-api-party'

export default defineNuxtPlugin(() => {
  return {
    provides: {
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
