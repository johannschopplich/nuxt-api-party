# Defaults

Default options for Nuxt API Party `$api` composables can be set in a Nuxt plugin. The plugin should provide `apiParty` which can define `defaults` and `endpoints.[endpointId].defaults`

`defaults` defines global defaults used for all endpoints, while `endpoints.[endpointId].defaults` defines defaults for a single endpoint.

The type `ModulePlugin` is provided as a convenience to ensure your plugin provides the correct defaults.

::: info
The `useApiData` composables will also use these defaults, as well as the relevant Nuxt configuration set in [`experimental.defaults`](https://nuxt.com/docs/4.x/guide/going-further/experimental-features#defaults).
:::

### Minimal example plugin

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
