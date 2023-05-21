export default defineNuxtConfig({
  modules: ['../src/module.ts'],

  apiParty: {
    endpoints: {
      jsonPlaceholder: {
        url: process.env.JSON_PLACEHOLDER_BASE_URL!,
      },
    },
  },

  typescript: {
    typeCheck: true,
    shim: false,
    tsConfig: {
      compilerOptions: {
        moduleResolution: 'bundler',
      },
    },
  },
})
