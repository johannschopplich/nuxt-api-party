import { defineNuxtConfig } from 'nuxt/config'
import NuxtApiParty from '../src/module'

export default defineNuxtConfig({
  modules: [NuxtApiParty],

  compatibilityDate: '2024-04-03',

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
          'x-api-party': 'nuxt-api-party',
        },
      },
      petStore: {
        url: 'https://petstore3.swagger.io/api/v3',
        schema: './schemas/petStore.yaml',
      },
    },
  },
})
