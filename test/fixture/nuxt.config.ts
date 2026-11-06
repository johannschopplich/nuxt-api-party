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
      clientApi: {
        url: '/api',
        token: 'client-token',
        query: { tenant: 'a' },
        headers: { 'x-endpoint': 'client', 'Authorization': 'Basic endpoint' },
        client: true,
      },
      credentialsApi: {
        url: '/api',
        forwardCredentials: true,
      },
      unsetSchemaApi: {
        url: '/api',
        schema: undefined,
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

  runtimeConfig: {
    apiParty: {
      endpoints: {
        runtimeSchemaApi: {
          url: '/api',
          schema: {
            openapi: '3.1.0',
            info: { title: 'Runtime Schema API', version: '1.0.0' },
            paths: {
              '/todos': {
                get: {
                  responses: {
                    200: {
                      description: 'Todos',
                      content: {
                        'application/json': {
                          schema: {
                            type: 'array',
                            items: { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
})
