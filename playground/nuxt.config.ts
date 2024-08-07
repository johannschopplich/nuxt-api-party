import { defineNuxtConfig } from 'nuxt/config'
import NuxtApiParty from '../src/module'

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',

  modules: [NuxtApiParty],

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
