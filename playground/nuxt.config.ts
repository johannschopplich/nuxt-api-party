import { isCI } from 'std-env'

export default defineNuxtConfig({
  modules: ['../src/module.ts'],

  apiParty: {
    endpoints: {
      'json-placeholder': {
        url: process.env.JSON_PLACEHOLDER_BASE_URL!,
      },
      'dummy-json': {
        url: 'https://dummyjson.com',
      },
    },
  },

  typescript: {
    typeCheck: !isCI,
    shim: false,
  },
})
