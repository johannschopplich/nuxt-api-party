export default defineNuxtConfig({
  modules: ['../src/module.ts'],

  apiParty: {
    name: 'json-placeholder',
  },

  typescript: {
    typeCheck: true,
    shim: false,
  },
})
