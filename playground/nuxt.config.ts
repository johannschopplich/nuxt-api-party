import { consola } from 'consola'
import { defineNuxtConfig } from 'nuxt/config'
import NuxtApiParty from '../src/module'

export default defineNuxtConfig({
  modules: [NuxtApiParty],

  compatibilityDate: '2025-09-01',

  experimental: {
    granularCachedData: true,
  },

  hooks: {
    'api-party:extend': async (options) => {
      consola.info('[Build] Resolved endpoints:')
      console.table(options.endpoints)
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
      custom: {
        url: '/api/custom',
      },
    },
  },
})
