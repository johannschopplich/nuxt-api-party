import { existsSync } from 'node:fs'
import { resolve } from 'pathe'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    existsSync(resolve(__dirname, '../dist/module.mjs')) ? 'nuxt-api-party' : '../src/module',
  ],

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
