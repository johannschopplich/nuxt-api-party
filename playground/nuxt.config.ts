export default defineNuxtConfig({
  modules: ['../src/module.ts'],

  apiParty: {
    endpoints: {
      jsonPlaceholder: {
        url: process.env.JSON_PLACEHOLDER_BASE_URL!,
      },
      petStore: {
        url: process.env.PET_STORE_BASE_URL!,
        schema: './schemas/petStore.json',
      },
    },
  },

  typescript: {
    // TODO: Re-enable when test directory can be excluded from type checking
    // typeCheck: 'build,
    shim: false,
    tsConfig: {
      compilerOptions: {
        moduleResolution: 'bundler',
      },
    },
  },
})
