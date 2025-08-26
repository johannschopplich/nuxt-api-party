import { defineNuxtConfig } from 'nuxt/config'
import NuxtApiParty from '../src/module'

export default defineNuxtConfig({
  modules: [NuxtApiParty],

  compatibilityDate: '2025-08-01',

  experimental: {
    granularCachedData: true,
  },

  hooks: {
    'api-party:extend': async (options) => {
      console.log(`[Build] Resolved endpoints:`, options.endpoints)
    },
  },

  apiParty: {
    // client: 'allow',
    experimental: {
      // disableClientPayloadCache: true,
      enablePrefixedProxy: true,
    },
    endpoints: {
      jsonPlaceholder: {
        url: 'https://jsonplaceholder.typicode.com',
        headers: {
          'X-Api-Party': 'nuxt-api-party',
        },
      },
      petStore: {
        url: 'https://petstore3.swagger.io/api/v3',
        schema: './schemas/petStore.yaml',
      },
    },
  },
})
