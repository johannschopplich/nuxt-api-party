import type { ModulePlugin } from '../../../src/module'
import { defineNuxtPlugin } from '#app'
import { useIDBCacheFetch } from '#imports'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      apiParty: {
        endpoints: {
          jsonPlaceholder: {
            defaults: {
              $fetch: useIDBCacheFetch({ dbName: 'api-party-playground', base: 'jsonPlaceholder' }),
            },
          },
        },
      },
    },
  }
}) satisfies ModulePlugin
