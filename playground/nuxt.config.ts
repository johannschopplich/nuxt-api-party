import { defineNuxtConfig } from 'nuxt/config'
import NuxtApiParty from '../src/module'

export default defineNuxtConfig({
  modules: [NuxtApiParty],

  compatibilityDate: '2024-04-03',

  hooks: {
    'api-party:resolve': async (id, endpoint) => {
      console.log(`[Build] Resolving schemas for ${id} with url ${endpoint.url}`)
    },
  },

  apiParty: {
    endpoints: {
      jsonPlaceholder: {
        url: process.env.JSON_PLACEHOLDER_BASE_URL!,
      },
      petStore: {
        url: process.env.PET_STORE_BASE_URL!,
        schema: './schemas/petStore.yaml',
      },
    },
  },
})
