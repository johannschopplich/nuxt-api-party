import { defineNuxtConfig } from 'nuxt/config'
import NuxtApiParty from '../src/module'

export default defineNuxtConfig({
  modules: [NuxtApiParty],

  compatibilityDate: '2025-06-01',

  hooks: {
    'api-party:extend': async (options) => {
      console.log(`[Build] Resolved endpoints:`, options.endpoints)
    },
  },

  apiParty: {
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
