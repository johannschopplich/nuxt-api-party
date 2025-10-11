import type { ModulePlugin } from '../../../src/module'
import { defineNuxtPlugin } from '#app'
import { useCacheStorageFetch } from '#imports'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      apiParty: {
        endpoints: {
          jsonPlaceholder: {
            defaults: {
              $fetch: useCacheStorageFetch(),
            },
          },
        },
      },
    },
  }
}) satisfies ModulePlugin
