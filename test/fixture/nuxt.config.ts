import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['../../src/module.ts'],

  apiParty: {
    endpoints: {
      testApi: {
        url: '/api',
      },
      forbidden: {
        url: '/api',
      },
      cookieApi: {
        url: '/api',
        cookies: true,
      },
      nestedApi: {
        url: '/api/nested',
        allowedUrls: ['/api'],
      },
      schemaApi: {
        url: '/api',
        schema: {
          openapi: '3.1.0',
          info: { title: 'Schema API', version: '1.0.0' },
          paths: {},
        },
      },
    },
  },
})
